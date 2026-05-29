import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Listings API integration', () => {
  let server: any;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await server.close();
  });

  it('should get all active listings', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/listings',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
