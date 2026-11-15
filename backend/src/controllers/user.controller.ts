import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Contract from '../models/Contract';
import User from '../models/User';

export interface PublicFreelancerProfile {
  _id: string;
  name: string;
  bio: string;
  skills: string[];
  avatar?: string;
  rating: number;
  completedJobs: number;
  joinedAt: string;
  portfolio: { title: string; url: string }[];
}

type PublicFreelancerRecord = {
  _id: mongoose.Types.ObjectId | string;
  name: string;
  bio?: string;
  skills?: string[];
  avatar_url?: string;
  rating?: number;
  portfolio?: string[];
  created_at: Date | string;
};

export interface PublicFreelancerProfileRepository {
  findById: (id: string) => Promise<PublicFreelancerRecord | null>;
  countCompletedJobs: (id: string) => Promise<number>;
}

const publicFreelancerProfileRepository: PublicFreelancerProfileRepository = {
  findById: (id) =>
    User.findOne({ _id: id, role: 'freelancer', is_banned: false })
      .select('name bio skills avatar_url rating portfolio created_at')
      .lean<PublicFreelancerRecord>(),
  countCompletedJobs: (id) => Contract.countDocuments({ freelancer_id: id, status: 'completed' }),
};

export const toPublicFreelancerProfile = (
  user: PublicFreelancerRecord,
  completedJobs: number
): PublicFreelancerProfile => ({
  _id: user._id.toString(),
  name: user.name,
  bio: user.bio || '',
  skills: user.skills || [],
  ...(user.avatar_url ? { avatar: user.avatar_url } : {}),
  rating: user.rating ?? 0,
  completedJobs,
  joinedAt: new Date(user.created_at).toISOString(),
  portfolio: (user.portfolio || [])
    .filter((url) => Boolean(url))
    .map((url, index) => ({
      title: `Portfolio item ${index + 1}`,
      url,
    })),
});

export const createGetPublicFreelancerProfile = (
  repository: PublicFreelancerProfileRepository = publicFreelancerProfileRepository
) => async (req: Request, res: Response): Promise<void> => {
  const freelancerId = req.params.id as string;

  if (!mongoose.isValidObjectId(freelancerId)) {
    res.status(404).json({ message: 'Freelancer not found' });
    return;
  }

  try {
    const user = await repository.findById(freelancerId);
    if (!user) {
      res.status(404).json({ message: 'Freelancer not found' });
      return;
    }

    const completedJobs = await repository.countCompletedJobs(freelancerId);
    res.json(toPublicFreelancerProfile(user, completedJobs));
  } catch (error) {
    console.error('Get public freelancer profile error:', error);
    res.status(500).json({ message: 'Failed to get freelancer profile' });
  }
};

export const getPublicFreelancerProfile = createGetPublicFreelancerProfile();
