import { FastifyPluginAsync } from 'fastify';
import { AuctionService } from '../../services/auction.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { verifyAccessToken } from '../../lib/jwt.js';
import { placeBidSchema } from '@gem/validators';

const auctionRoutes: FastifyPluginAsync = async (fastify) => {
  const auctionService = new AuctionService(fastify);

  // 1. WebSocket Endpoint for Real-Time Auction Updates
  fastify.get('/:id/stream', { websocket: true }, (socket, request) => {
    const listingId = (request.params as any).id;
    const url = new URL(request.url || '', 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      (socket as any).auctionListingId = listingId;
      (socket as any).userId = null;
      (socket as any).userRole = 'GUEST';
      socket.send(JSON.stringify({ type: 'CONNECTED', message: `Connected to auction ${listingId} as Guest` }));
      return;
    }

    try {
      const decoded = verifyAccessToken(token);
      (socket as any).userId = decoded.sub;
      (socket as any).userRole = decoded.role;
    } catch (err) {
      (socket as any).userId = null;
      (socket as any).userRole = 'GUEST';
      socket.send(JSON.stringify({ type: 'WARNING', message: 'Token expired or invalid. Connected as Guest.' }));
    }

    // Attach listingId to connection to target broadcasts
    (socket as any).auctionListingId = listingId;

    // Send an initial connected message
    socket.send(JSON.stringify({ type: 'CONNECTED', message: `Connected to auction ${listingId}` }));

    socket.on('message', (message: any) => {
      // Clients generally shouldn't send messages over this WS, but we can handle ping/pong if needed
    });
    
    socket.on('close', () => {
      // Clean up if needed
    });
  });

  // 2. HTTP Endpoints
  // Get initial state
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const state = await auctionService.getAuctionState(id);
    return reply.send({ data: state });
  });

  // Place a bid (requires authentication)
  fastify.post('/:id/bids', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;
    
    const data = placeBidSchema.parse(request.body);
    const bid = await auctionService.placeBid(id, user.id, data, request.ip);
    
    return reply.status(201).send({ data: bid });
  });
};

export default auctionRoutes;
