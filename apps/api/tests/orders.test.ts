import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Orders and Disputes API integration', () => {
  let server: any;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await server.close();
  });

  it('should deny listing order list for unauthenticated user', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/orders/purchases',
    });

    expect(response.statusCode).toBe(401);
  });
});
