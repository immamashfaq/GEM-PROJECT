import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Admin Safety Actions integration', () => {
  let server: any;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await server.close();
  });

  it('should deny access to KYC pending queue for non-admins', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/admin/kyc/pending',
    });

    expect(response.statusCode).toBe(401);
  });
});
