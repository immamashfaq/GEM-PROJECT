import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auctions API integration', () => {
  let server: any;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await server.close();
  });

  it('should deny bidding if user is unauthenticated', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/auctions/some-auction-id/bids',
      payload: {
        amount: 200000,
      },
    });

    expect(response.statusCode).toBe(401);
  });
});
