import cloudinary from '../config/cloudinary';
import Deliverable from '../models/Deliverable';

const SIGNED_URL_EXPIRY = 2 * 60 * 60; // 2 hours in seconds

/**
 * Generate a watermarked preview URL for a deliverable based on file type.
 * The original file is NEVER exposed — only the transformed version.
 */
export const generateWatermarkedUrl = (
  publicId: string,
  fileType: 'image' | 'video' | 'document' | 'audio' | 'other',
  viewerUserId: string,
  viewerUsername: string
): string => {
  const date = new Date().toISOString().split('T')[0];
  const watermarkText = `${viewerUsername} | PREVIEW ONLY | TrustLance | ${date}`;

  switch (fileType) {
    case 'image': {
      // Resize to max 800px, add centered watermark + diagonal tiled watermark
      const url = cloudinary.url(publicId, {
        sign_url: true,
        type: 'private',
        resource_type: 'image',
        transformation: [
          { width: 800, crop: 'limit', quality: 'auto:low' },
          {
            overlay: {
              font_family: 'Arial',
              font_size: 28,
              font_weight: 'bold',
              text: watermarkText,
            },
            color: '#FFFFFF',
            opacity: 35,
            gravity: 'center',
          },
          {
            overlay: {
              font_family: 'Arial',
              font_size: 20,
              text: 'PREVIEW ONLY',
            },
            color: '#FFFFFF',
            opacity: 15,
            gravity: 'north_west',
            angle: -30,
            x: 50,
            y: 50,
          },
          {
            overlay: {
              font_family: 'Arial',
              font_size: 20,
              text: 'PREVIEW ONLY',
            },
            color: '#FFFFFF',
            opacity: 15,
            gravity: 'south_east',
            angle: -30,
            x: 50,
            y: 50,
          },
        ],
        expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_EXPIRY,
      });
      return url;
    }

    case 'video': {
      // Transcode to 480p, add persistent text overlay
      const url = cloudinary.url(publicId, {
        sign_url: true,
        type: 'private',
        resource_type: 'video',
        transformation: [
          { width: 854, height: 480, crop: 'limit', quality: 'auto:low' },
          {
            overlay: {
              font_family: 'Arial',
              font_size: 24,
              font_weight: 'bold',
              text: `${viewerUsername} | PREVIEW ONLY`,
            },
            color: '#FFFFFF',
            opacity: 60,
            gravity: 'north_east',
            x: 10,
            y: 10,
          },
          { flags: 'no_download' },
        ],
        expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_EXPIRY,
      });
      return url;
    }

    case 'audio': {
      // For audio, we transcode to lower quality mono
      // Audio watermarking (beep injection) would need FFmpeg pre-processing
      const url = cloudinary.url(publicId, {
        sign_url: true,
        type: 'private',
        resource_type: 'video', // Cloudinary uses 'video' resource type for audio
        transformation: [
          { audio_codec: 'mp3', bit_rate: '96k' },
          // Note: Cloudinary can't inject audio beeps natively
          // In production, pre-process with FFmpeg before upload
        ],
        expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_EXPIRY,
      });
      return url;
    }

    case 'document': {
      // For documents (PDF), we can show page-limited preview
      // Cloudinary supports PDF page extraction
      const url = cloudinary.url(publicId, {
        sign_url: true,
        type: 'private',
        resource_type: 'image', // Cloudinary converts PDF pages to images
        transformation: [
          { page: '1-3' }, // Show only first 3 pages
          { width: 800, crop: 'limit', quality: 'auto:low' },
          {
            overlay: {
              font_family: 'Arial',
              font_size: 28,
              font_weight: 'bold',
              text: 'PREVIEW ONLY - TrustLance',
            },
            color: '#FF0000',
            opacity: 30,
            gravity: 'center',
            angle: -30,
          },
        ],
        expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_EXPIRY,
      });
      return url;
    }

    case 'other':
    default: {
      // For unknown file types, return a placeholder — no preview available
      // File metadata is shown instead
      return '';
    }
  }
};

/**
 * Log when a client previews a deliverable (audit trail).
 */
export const logPreviewAccess = async (
  deliverableId: string,
  viewerUserId: string,
  ip: string,
  userAgent: string
): Promise<void> => {
  await Deliverable.findByIdAndUpdate(deliverableId, {
    $push: {
      preview_logs: {
        viewed_by: viewerUserId,
        ip,
        user_agent: userAgent,
        viewed_at: new Date(),
      },
    },
  });
};

/**
 * Generate a clean (unwatermarked) download URL for the original file.
 * Called ONLY after payment is released.
 */
export const generateCleanUrl = (publicId: string, resourceType: string = 'image'): string => {
  const thirtyDaysInSeconds = 30 * 24 * 60 * 60;

  const url = cloudinary.url(publicId, {
    sign_url: true,
    type: 'private',
    resource_type: resourceType as 'image' | 'video' | 'raw',
    transformation: [], // No transformations — original quality
    expires_at: Math.floor(Date.now() / 1000) + thirtyDaysInSeconds,
  });

  return url;
};

/**
 * Map file extension to our file type enum.
 */
export const detectFileType = (fileName: string): 'video' | 'image' | 'document' | 'audio' | 'other' => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv'];
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'psd', 'ai'];
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages', 'md'];
  const audioExts = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'm4a'];

  if (videoExts.includes(ext)) return 'video';
  if (imageExts.includes(ext)) return 'image';
  if (docExts.includes(ext)) return 'document';
  if (audioExts.includes(ext)) return 'audio';
  return 'other';
};

export default {
  generateWatermarkedUrl,
  logPreviewAccess,
  generateCleanUrl,
  detectFileType,
};
