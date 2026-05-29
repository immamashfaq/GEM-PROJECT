import { FastifyPluginAsync } from 'fastify';
import { StreamService } from '../../services/stream.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { verifyAccessToken } from '../../lib/jwt.js';
import { createStreamSchema, sendChatMessageSchema } from '@gem/validators';

const streamRoutes: FastifyPluginAsync = async (fastify) => {
  const streamService = new StreamService(fastify);

  // Get active streams (Public)
  fastify.get('/', async (request, reply) => {
    const streams = await streamService.getActiveStreams();
    return reply.send({ data: streams });
  });

  // Get stream details (Public)
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const stream = await streamService.getStreamById(id);
    return reply.send({ data: stream });
  });

  // Create Stream (Seller only)
  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const data = createStreamSchema.parse(request.body);
    const providerName = process.env.STREAM_PROVIDER || 'mock';
    const stream = await streamService.createStream(request.user!.id, data, providerName);
    return reply.status(201).send({ data: stream });
  });

  // Get Private Stream Credentials (Seller only)
  fastify.get('/:id/credentials', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const credentials = await streamService.getStreamCredentials(request.user!.id, id);
    return reply.send({ data: credentials });
  });

  // End Stream (Seller only)
  fastify.post('/:id/end', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const stream = await streamService.endStream(request.user!.id, id);
    return reply.send({ data: stream });
  });

  // Get Chat History (Public)
  fastify.get('/:id/chat-history', async (request, reply) => {
    const { id } = request.params as { id: string };
    const history = await streamService.getChatHistory(id);
    // Reverse so older is first
    return reply.send({ data: history.reverse() });
  });

  // Send HTTP Chat Message
  fastify.post('/:id/chat', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = sendChatMessageSchema.parse(request.body);
    
    const message = await streamService.saveChatMessage(id, request.user!.id, data);
    
    // Broadcast via WS
    for (const client of fastify.websocketServer.clients) {
      if (client.readyState === 1) { // OPEN
        const clientStreamId = (client as any).streamId;
        if (clientStreamId === id) {
          client.send(JSON.stringify({ type: 'NEW_CHAT_MESSAGE', data: message }));
        }
      }
    }

    return reply.status(201).send({ data: message });
  });

  // Delete Chat Message (Admin only)
  fastify.delete('/:id/chat/:messageId', { preHandler: authenticate }, async (request, reply) => {
    if (request.user!.role !== 'ADMIN') {
      return reply.forbidden('Only admins can delete messages');
    }
    const { id, messageId } = request.params as { id: string; messageId: string };
    await streamService.adminDeleteMessage(id, messageId, request.user!.id);
    return reply.send({ success: true, message: 'Message deleted' });
  });

  // WebSocket Chat Endpoint
  fastify.get('/:id/chat/stream', { websocket: true }, (socket, request) => {
    const streamId = (request.params as any).id;
    const url = new URL(request.url || '', 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      (socket as any).streamId = streamId;
      (socket as any).userId = null;
      (socket as any).userRole = 'GUEST';
      socket.send(JSON.stringify({ type: 'CONNECTED', message: `Connected to stream ${streamId} chat as Guest` }));
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

    // Attach streamId to connection to target broadcasts
    (socket as any).streamId = streamId;

    // Send an initial connected message
    socket.send(JSON.stringify({ type: 'CONNECTED', message: `Connected to stream ${streamId} chat` }));

    socket.on('message', (message: any) => {
      // Handled via HTTP POST
    });
    
    socket.on('close', () => {
      // Clean up viewer count or presence if needed
    });
  });
};

export default streamRoutes;
