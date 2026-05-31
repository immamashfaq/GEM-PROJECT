import { FastifyInstance } from 'fastify';
import { CreateStreamInput, SendChatMessageInput } from '@gem/validators';
import { streamingRegistry } from '../lib/streaming/provider-registry.js';

export class StreamService {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Creates a stream session with seller/listing validation and provider configuration.
   */
  async createStream(sellerId: string, data: CreateStreamInput & { listingId?: string }, providerName: string = 'mock') {
    const { prisma } = this.fastify;

    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      include: { sellerProfile: true },
    });

    if (!seller || !seller.sellerProfile || (seller.role !== 'VERIFIED_SELLER' && seller.role !== 'ADMIN' && seller.role !== 'SUPER_ADMIN')) {
      throw this.fastify.httpErrors.forbidden('Only verified sellers can create live streams');
    }

    // Enforce link to approved active listing
    if (data.listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: data.listingId },
      });

      if (!listing) {
        throw this.fastify.httpErrors.notFound('Linked gemstone listing not found');
      }

      if (listing.sellerId !== sellerId) {
        throw this.fastify.httpErrors.forbidden('Cannot link a listing you do not own');
      }

      if (listing.status !== 'ACTIVE') {
        throw this.fastify.httpErrors.badRequest('Linked listing must be active');
      }
    }

    let streamKey: string | null = null;
    let playbackUrl: string | null = data.externalUrl || null;
    let rtmpUrl: string | null = null;
    let providerReference: string | null = null;

    if (!data.externalUrl) {
      // Fetch stream ingest details from provider registry
      const provider = streamingRegistry.get(providerName);
      const session = await provider.createStream(data.title, data.description || '');
      streamKey = session.streamKey;
      playbackUrl = session.playbackUrl;
      rtmpUrl = session.rtmpUrl;
      providerReference = session.providerReference;
    }

    const stream = await prisma.liveStream.create({
      data: {
        sellerProfileId: seller.sellerProfile.id,
        listingId: data.listingId || null,
        title: data.title,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        streamKey,
        playbackUrl,
        rtmpUrl,
        providerReference,
        status: 'LIVE',
        startedAt: new Date(),
      },
    });

    return stream;
  }

  /**
   * Safe fetch of active streams (excluding secret stream keys)
   */
  async getActiveStreams() {
    return this.fastify.prisma.liveStream.findMany({
      where: { status: { in: ['LIVE', 'FLAGGED'] } },
      select: {
        id: true,
        sellerProfileId: true,
        listingId: true,
        title: true,
        description: true,
        status: true,
        playbackUrl: true,
        thumbnailUrl: true,
        viewerCount: true,
        peakViewers: true,
        startedAt: true,
        sellerProfile: {
          include: {
            user: { select: { username: true, id: true } },
          },
        },
        _count: {
          select: { viewers: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Safe fetch of single stream details (excluding keys)
   */
  async getStreamById(id: string) {
    const stream = await this.fastify.prisma.liveStream.findUnique({
      where: { id },
      select: {
        id: true,
        sellerProfileId: true,
        listingId: true,
        title: true,
        description: true,
        status: true,
        playbackUrl: true,
        thumbnailUrl: true,
        viewerCount: true,
        peakViewers: true,
        startedAt: true,
        sellerProfile: {
          include: {
            user: { select: { username: true, id: true } },
          },
        },
        _count: {
          select: { viewers: true },
        },
      },
    });

    if (!stream) {
      throw this.fastify.httpErrors.notFound('Stream not found');
    }

    return stream;
  }

  /**
   * Secured endpoint for the seller to get publish credentials.
   */
  async getStreamCredentials(sellerId: string, streamId: string) {
    const stream = await this.fastify.prisma.liveStream.findUnique({
      where: { id: streamId },
      include: {
        sellerProfile: {
          include: {
            user: { select: { id: true } },
          },
        },
      },
    });

    if (!stream) {
      throw this.fastify.httpErrors.notFound('Stream not found');
    }

    if (stream.sellerProfile.user.id !== sellerId) {
      throw this.fastify.httpErrors.forbidden('Cannot retrieve credentials for a stream you do not own');
    }

    return {
      streamKey: stream.streamKey,
      rtmpUrl: stream.rtmpUrl,
      playbackUrl: stream.playbackUrl,
    };
  }

  async endStream(sellerId: string, streamId: string) {
    const stream = await this.fastify.prisma.liveStream.findUnique({
      where: { id: streamId },
      include: {
        sellerProfile: {
          include: {
            user: { select: { id: true } },
          },
        },
      },
    });

    if (!stream) {
      throw this.fastify.httpErrors.notFound('Stream not found');
    }
    
    if (stream.sellerProfile.user.id !== sellerId) {
      throw this.fastify.httpErrors.forbidden('You can only end your own streams');
    }

    // Call provider to cleanup if applicable
    if (stream.providerReference) {
      try {
        const provider = streamingRegistry.get('mux');
        await provider.deleteStream(stream.providerReference);
      } catch {
        // Ignore provider deletion failures during manual end
      }
    }

    return this.fastify.prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });
  }

  /**
   * Profanity filtering logic helper
   */
  private filterProfanity(message: string): string {
    const blacklist = [/fuck/gi, /shit/gi, /bitch/gi, /asshole/gi, /spam/gi, /cheap pills/gi, /buy viagra/gi];
    let filtered = message;
    for (const pattern of blacklist) {
      filtered = filtered.replace(pattern, (match) => '*'.repeat(match.length));
    }
    return filtered;
  }

  /**
   * Saves chat messages applying Redis rate limiting and content filtering.
   */
  async saveChatMessage(streamId: string, userId: string, data: SendChatMessageInput) {
    const { prisma, redis } = this.fastify;

    // 1. Rate Limit: 1 message per second per user on this stream
    if (redis) {
      const rateLimitKey = `rate:chat:${userId}:${streamId}`;
      const exists = await redis.get(rateLimitKey);
      if (exists) {
        throw this.fastify.httpErrors.tooManyRequests('Please wait 1 second between chat messages');
      }
      await redis.set(rateLimitKey, '1', 'EX', 1);
    }

    // 2. Clean Profanity/Spam
    const cleanMessage = this.filterProfanity(data.message);

    return prisma.streamChatMessage.create({
      data: {
        streamId,
        userId,
        message: cleanMessage,
      },
      include: {
        user: { select: { id: true, username: true } },
      },
    });
  }

  async getChatHistory(streamId: string) {
    return this.fastify.prisma.streamChatMessage.findMany({
      where: { streamId, isDeleted: false },
      include: {
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // --- Administrative Moderation Methods ---

  async flagStream(streamId: string, adminId: string) {
    return this.fastify.prisma.liveStream.update({
      where: { id: streamId },
      data: { status: 'FLAGGED' },
    });
  }

  async suspendStream(streamId: string, adminId: string) {
    const stream = await this.fastify.prisma.liveStream.findUnique({
      where: { id: streamId },
    });
    if (!stream) {
      throw this.fastify.httpErrors.notFound('Stream not found');
    }

    if (stream.providerReference) {
      try {
        const provider = streamingRegistry.get('mux');
        await provider.deleteStream(stream.providerReference);
      } catch (err) {
        this.fastify.log.warn(err, 'Failed to delete suspended stream at provider');
      }
    }

    return this.fastify.prisma.liveStream.update({
      where: { id: streamId },
      data: { status: 'SUSPENDED', endedAt: new Date() },
    });
  }

  async adminDeleteMessage(streamId: string, messageId: string, adminId: string) {
    const message = await this.fastify.prisma.streamChatMessage.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    // Broadcast deletion event to connected WebSocket stream clients
    const wss = this.fastify.websocketServer;
    if (wss) {
      const payload = JSON.stringify({
        type: 'CHAT_MESSAGE_DELETED',
        data: { messageId },
      });
      for (const client of wss.clients) {
        if (client.readyState === 1 && (client as any).streamId === streamId) {
          client.send(payload);
        }
      }
    }

    return message;
  }
}
