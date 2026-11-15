import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Request, Response } from 'express';
import {
  createGetPublicFreelancerProfile,
  PublicFreelancerProfileRepository,
} from '../src/controllers/user.controller';

const freelancerId = '507f1f77bcf86cd799439011';

const createResponse = () => {
  let statusCode = 200;
  let body: unknown;

  const response = {
    status(code: number) {
      statusCode = code;
      return response;
    },
    json(payload: unknown) {
      body = payload;
      return response;
    },
  } as unknown as Response;

  return {
    response,
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
  };
};

const createRequest = (id: string) => ({
  params: { id },
}) as unknown as Request;

test('returns a public freelancer profile without sensitive fields', async () => {
  const repository: PublicFreelancerProfileRepository = {
    findById: async () => ({
      _id: freelancerId,
      name: 'Asha Freelancer',
      bio: 'Builds accessible web applications.',
      skills: ['TypeScript', 'React'],
      avatar_url: 'https://example.com/avatar.png',
      rating: 4.8,
      portfolio: ['https://example.com/project'],
      created_at: '2025-01-15T00:00:00.000Z',
    }),
    countCompletedJobs: async () => 3,
  };
  const handler = createGetPublicFreelancerProfile(repository);
  const result = createResponse();

  await handler(createRequest(freelancerId), result.response);

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, {
    _id: freelancerId,
    name: 'Asha Freelancer',
    bio: 'Builds accessible web applications.',
    skills: ['TypeScript', 'React'],
    avatar: 'https://example.com/avatar.png',
    rating: 4.8,
    completedJobs: 3,
    joinedAt: '2025-01-15T00:00:00.000Z',
    portfolio: [{ title: 'Portfolio item 1', url: 'https://example.com/project' }],
  });

  const publicProfile = result.body as Record<string, unknown>;
  assert.equal('email' in publicProfile, false);
  assert.equal('password' in publicProfile, false);
  assert.equal('wallet_balance' in publicProfile, false);
  assert.equal('kyc_documents' in publicProfile, false);
  assert.equal('refresh_tokens' in publicProfile, false);
});

test('returns 404 when the requested freelancer does not exist', async () => {
  const repository: PublicFreelancerProfileRepository = {
    findById: async () => null,
    countCompletedJobs: async () => 0,
  };
  const handler = createGetPublicFreelancerProfile(repository);
  const result = createResponse();

  await handler(createRequest(freelancerId), result.response);

  assert.equal(result.statusCode, 404);
  assert.deepEqual(result.body, { message: 'Freelancer not found' });
});

test('returns 404 for an invalid user id', async () => {
  const repository: PublicFreelancerProfileRepository = {
    findById: async () => {
      throw new Error('The repository should not be called for invalid ids');
    },
    countCompletedJobs: async () => 0,
  };
  const handler = createGetPublicFreelancerProfile(repository);
  const result = createResponse();

  await handler(createRequest('not-an-object-id'), result.response);

  assert.equal(result.statusCode, 404);
  assert.deepEqual(result.body, { message: 'Freelancer not found' });
});
