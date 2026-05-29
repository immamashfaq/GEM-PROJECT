import type { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { authRoutes } from './routes/auth/auth.routes.js';
import { listingRoutes } from './routes/listings/listing.routes.js';
import { searchRoutes } from './routes/search/search.routes.js';
import { userRoutes } from './routes/users/user.routes.js';
import { uploadRoutes } from './routes/uploads/upload.routes.js';
import kycRoutes from './routes/kyc/kyc.routes.js';
import adminRoutes from './routes/admin/admin.routes.js';
import offerRoutes from './routes/offers/offer.routes.js';
import orderRoutes from './routes/orders/order.routes.js';
import auctionRoutes from './routes/auctions/auction.routes.js';
import paymentRoutes from './routes/payments/payment.routes.js';
import disputeRoutes from './routes/disputes/dispute.routes.js';
import streamRoutes from './routes/streams/stream.routes.js';
import reportRoutes from './routes/reports/report.routes.js';

export async function registerRoutes(server: FastifyInstance) {
  const prefix = '/api/v1';

  // Register WebSocket plugin
  await server.register(websocket);

  await server.register(authRoutes, { prefix: `${prefix}/auth` });
  await server.register(listingRoutes, { prefix: `${prefix}/listings` });
  await server.register(searchRoutes, { prefix: `${prefix}/search` });
  await server.register(userRoutes, { prefix: `${prefix}/users` });
  await server.register(uploadRoutes, { prefix: `${prefix}/uploads` });
  await server.register(kycRoutes, { prefix: `${prefix}/kyc` });
  await server.register(adminRoutes, { prefix: `${prefix}/admin` });
  await server.register(offerRoutes, { prefix: `${prefix}/offers` });
  await server.register(orderRoutes, { prefix: `${prefix}/orders` });
  await server.register(auctionRoutes, { prefix: `${prefix}/auctions` });
  await server.register(paymentRoutes, { prefix: `${prefix}/payments` });
  await server.register(disputeRoutes, { prefix: `${prefix}/disputes` });
  await server.register(streamRoutes, { prefix: `${prefix}/streams` });
  await server.register(reportRoutes, { prefix: `${prefix}/reports` });
}
