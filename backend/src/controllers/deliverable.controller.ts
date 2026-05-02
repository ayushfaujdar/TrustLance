import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Deliverable from '../models/Deliverable';
import Contract from '../models/Contract';
import EscrowTransaction from '../models/EscrowTransaction';
import cloudinary from '../config/cloudinary';
import { generateWatermarkedUrl, logPreviewAccess, generateCleanUrl, detectFileType } from '../services/watermark.service';
import { releaseFunds } from '../services/escrow.service';
import { createNotification } from '../services/notification.service';
import { emitToUser } from '../socket/socket.handler';
import { z } from 'zod';

const uploadSchema = z.object({
  contractId: z.string(),
  milestoneId: z.string(),
  messageToClient: z.string().optional(),
});

const revisionSchema = z.object({
  feedback: z.string().min(10, 'Please provide detailed feedback (min 10 characters)'),
});

/**
 * POST /api/deliverables/upload — Freelancer submits a deliverable
 */
export const uploadDeliverable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = uploadSchema.parse(req.body);
    const freelancerId = req.user!._id.toString();

    // 1. Verify freelancer owns this contract
    const contract = await Contract.findById(validated.contractId);
    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }
    if (contract.freelancer_id.toString() !== freelancerId) {
      res.status(403).json({ message: 'Not your contract' });
      return;
    }

    // 2. Verify milestone status
    const milestone = contract.milestones.find(
      (m) => m._id.toString() === validated.milestoneId
    );
    if (!milestone) {
      res.status(404).json({ message: 'Milestone not found' });
      return;
    }
    if (!['in_progress', 'funded', 'revision_requested'].includes(milestone.status)) {
      res.status(400).json({ message: `Cannot deliver — milestone status is ${milestone.status}` });
      return;
    }

    // 3. Check file
    if (!req.file) {
      res.status(400).json({ message: 'File is required' });
      return;
    }

    // 4. Upload original to Cloudinary as private
    const fileType = detectFileType(req.file.originalname);
    const resourceType = fileType === 'video' || fileType === 'audio' ? 'video' : fileType === 'document' ? 'raw' : 'image';

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: `trustlance/originals/${validated.contractId}/${validated.milestoneId}`,
      type: 'private',
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
    });

    // 5. Generate watermarked preview URL
    const viewerName = (await Contract.findById(validated.contractId).populate('client_id', 'name'))
      ?.client_id as unknown as { name: string };
    const watermarkedUrl = generateWatermarkedUrl(
      uploadResult.public_id,
      fileType,
      contract.client_id.toString(),
      viewerName?.name || 'Client'
    );

    // 6. Count revision number
    const existingDeliverables = await Deliverable.countDocuments({
      contract_id: validated.contractId,
      milestone_id: validated.milestoneId,
    });

    // 7. Create deliverable document
    const deliverable = await Deliverable.create({
      contract_id: validated.contractId,
      milestone_id: validated.milestoneId,
      freelancer_id: freelancerId,
      original_file_url: uploadResult.secure_url,
      watermarked_file_url: watermarkedUrl,
      file_type: fileType,
      file_size: uploadResult.bytes,
      file_name: req.file.originalname,
      cloudinary_public_id: uploadResult.public_id,
      revision_number: existingDeliverables + 1,
      message_to_client: validated.messageToClient,
      status: 'submitted',
    });

    // 8. Update milestone status
    milestone.status = 'delivered';
    await contract.save();

    // 9. Notifications
    const clientId = contract.client_id.toString();
    emitToUser(clientId, 'delivery:new', {
      contractId: validated.contractId,
      milestoneId: validated.milestoneId,
      deliverableId: deliverable._id,
      fileName: req.file.originalname,
      fileType,
    });

    await createNotification(
      clientId,
      'delivery_submitted',
      'New Delivery Ready for Review',
      `A new ${fileType} deliverable has been submitted for "${milestone.title}". Please review it.`,
      `/client/projects/${validated.contractId}`
    );

    res.status(201).json({
      message: 'Delivered successfully',
      deliverable: {
        id: deliverable._id,
        previewUrl: watermarkedUrl,
        fileName: req.file.originalname,
        fileType,
        revisionNumber: deliverable.revision_number,
        status: 'submitted',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    console.error('Upload deliverable error:', error);
    res.status(500).json({ message: 'Failed to upload deliverable' });
  }
};

/**
 * GET /api/deliverables/:id/preview — Client views watermarked preview
 */
export const getPreview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deliverable = await Deliverable.findById(req.params.id);
    if (!deliverable) {
      res.status(404).json({ message: 'Deliverable not found' });
      return;
    }

    // Verify client owns this contract
    const contract = await Contract.findById(deliverable.contract_id);
    if (!contract || contract.client_id.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Not authorized to view this deliverable' });
      return;
    }

    // Re-generate fresh signed watermarked URL
    const freshUrl = generateWatermarkedUrl(
      deliverable.cloudinary_public_id,
      deliverable.file_type,
      req.user!._id.toString(),
      req.user!.name
    );

    // Log preview access
    await logPreviewAccess(
      deliverable._id.toString(),
      req.user!._id.toString(),
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown'
    );

    res.json({
      previewUrl: freshUrl,
      fileType: deliverable.file_type,
      fileName: deliverable.file_name,
      fileSize: deliverable.file_size,
      revisionNumber: deliverable.revision_number,
      messageFromFreelancer: deliverable.message_to_client,
      submittedAt: deliverable.created_at,
    });
  } catch (error) {
    console.error('Get preview error:', error);
    res.status(500).json({ message: 'Failed to get preview' });
  }
};

/**
 * POST /api/deliverables/:id/approve — Client approves delivery
 * This triggers escrow release (atomic: money + file unlock)
 */
export const approveDeliverable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deliverable = await Deliverable.findById(req.params.id);
    if (!deliverable) {
      res.status(404).json({ message: 'Deliverable not found' });
      return;
    }

    const contract = await Contract.findById(deliverable.contract_id);
    if (!contract || contract.client_id.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    if (deliverable.status !== 'submitted') {
      res.status(400).json({ message: `Cannot approve — status is ${deliverable.status}` });
      return;
    }

    // 1. Update deliverable status
    deliverable.status = 'approved';
    deliverable.approved_at = new Date();
    await deliverable.save();

    // 2. Release escrow funds
    const escrowTx = await EscrowTransaction.findOne({
      contract_id: deliverable.contract_id,
      milestone_id: deliverable.milestone_id,
      status: 'funded',
    });

    if (escrowTx) {
      await releaseFunds(
        escrowTx._id.toString(),
        req.user!._id.toString(),
        req.ip || 'system'
      );
    }

    // 3. Generate clean download URL
    const resourceType = deliverable.file_type === 'video' || deliverable.file_type === 'audio'
      ? 'video'
      : deliverable.file_type === 'document'
        ? 'raw'
        : 'image';
    const cleanUrl = generateCleanUrl(deliverable.cloudinary_public_id, resourceType);

    // 4. Notify freelancer
    const freelancerId = deliverable.freelancer_id.toString();
    emitToUser(freelancerId, 'delivery:approved', {
      deliverableId: deliverable._id,
      milestoneId: deliverable.milestone_id,
    });

    await createNotification(
      freelancerId,
      'payment_released',
      'Delivery Approved! 🎉',
      'Your delivery has been approved and payment has been released to your wallet.',
      `/freelancer/earnings`
    );

    res.json({
      message: 'Delivery approved and payment released',
      downloadUrl: cleanUrl,
    });
  } catch (error) {
    console.error('Approve deliverable error:', error);
    res.status(500).json({ message: 'Failed to approve deliverable' });
  }
};

/**
 * POST /api/deliverables/:id/request-revision — Client requests changes
 */
export const requestRevision = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validated = revisionSchema.parse(req.body);

    const deliverable = await Deliverable.findById(req.params.id);
    if (!deliverable) {
      res.status(404).json({ message: 'Deliverable not found' });
      return;
    }

    const contract = await Contract.findById(deliverable.contract_id);
    if (!contract || contract.client_id.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    if (deliverable.status !== 'submitted') {
      res.status(400).json({ message: `Cannot request revision — status is ${deliverable.status}` });
      return;
    }

    // Check revision limit
    if (contract.revisions_used >= contract.max_revisions) {
      res.status(400).json({
        message: `Maximum revisions reached (${contract.max_revisions}). You must approve or open a dispute.`,
      });
      return;
    }

    // 1. Update deliverable
    deliverable.status = 'revision_requested';
    await deliverable.save();

    // 2. Increment revision counter
    contract.revisions_used += 1;
    const milestone = contract.milestones.find(
      (m) => m._id.toString() === deliverable.milestone_id
    );
    if (milestone) {
      milestone.status = 'in_progress';
    }
    await contract.save();

    // 3. Reset auto-release timer (+7 days)
    const escrowTx = await EscrowTransaction.findOne({
      contract_id: deliverable.contract_id.toString(),
      milestone_id: deliverable.milestone_id,
      status: 'funded',
    });
    if (escrowTx) {
      escrowTx.auto_release_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      escrowTx.warning_48h_sent = false;
      escrowTx.warning_24h_sent = false;
      await escrowTx.save();
    }

    // 4. Notify freelancer
    const freelancerId = deliverable.freelancer_id.toString();
    emitToUser(freelancerId, 'revision:requested', {
      deliverableId: deliverable._id,
      feedback: validated.feedback,
      revisionsUsed: contract.revisions_used,
      maxRevisions: contract.max_revisions,
    });

    await createNotification(
      freelancerId,
      'revision_requested',
      'Revision Requested',
      `The client has requested changes: "${validated.feedback.substring(0, 100)}..."`,
      `/freelancer/dashboard`
    );

    res.json({
      message: 'Revision requested',
      revisionsUsed: contract.revisions_used,
      maxRevisions: contract.max_revisions,
      revisionsRemaining: contract.max_revisions - contract.revisions_used,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.issues });
      return;
    }
    console.error('Request revision error:', error);
    res.status(500).json({ message: 'Failed to request revision' });
  }
};

/**
 * GET /api/deliverables/contract/:contractId — List all deliverables for a contract
 */
export const getContractDeliverables = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findById(req.params.contractId);
    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    const userId = req.user!._id.toString();
    const isParty = contract.client_id.toString() === userId || contract.freelancer_id.toString() === userId;
    if (!isParty) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const deliverables = await Deliverable.find({ contract_id: req.params.contractId })
      .sort({ created_at: -1 })
      .lean();

    res.json({ deliverables });
  } catch (error) {
    console.error('Get contract deliverables error:', error);
    res.status(500).json({ message: 'Failed to get deliverables' });
  }
};
