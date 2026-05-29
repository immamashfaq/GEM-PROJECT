import type { FastifyInstance } from 'fastify';
import { PlaceBidInput } from '@gem/validators';
import { randomBytes } from 'crypto';

export class AuctionService {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Places a bid safely using transactional checks, row locking, and rate limiting.
   */
  async placeBid(listingId: string, buyerId: string, data: PlaceBidInput, ipAddress?: string) {
    const { prisma } = this.fastify;
    const bidAmount = data.amount;
    const redis = this.fastify.redis;

    // 1. Redis Rate Limiting
    if (redis) {
      // 2 seconds rate limit per buyer on this listing
      const rateLimitKey = `rate:bid:${buyerId}:${listingId}`;
      const exists = await redis.get(rateLimitKey);
      if (exists) {
        throw this.fastify.httpErrors.tooManyRequests('Please wait 2 seconds between bids');
      }
      await redis.set(rateLimitKey, '1', 'EX', 2);

      // Max 5 bids per 10 seconds on this listing
      const rapidKey = `rapid:bid:${buyerId}:${listingId}`;
      const bidsCount = await redis.incr(rapidKey);
      if (bidsCount === 1) {
        await redis.expire(rapidKey, 10);
      }
      if (bidsCount > 5) {
        throw this.fastify.httpErrors.tooManyRequests('Suspicious rapid bidding activity detected. Please slow down.');
      }
    }

    // 2. Process Bid inside a transaction with Postgres FOR UPDATE row locking
    const result = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({
        where: { id: listingId },
        include: { auction: true },
      });

      if (!listing) {
        throw this.fastify.httpErrors.notFound('Listing not found');
      }

      if (listing.listingType !== 'TIMED_AUCTION' && listing.listingType !== 'LIVE_AUCTION') {
        throw this.fastify.httpErrors.badRequest('Listing is not an auction');
      }

      if (listing.status !== 'ACTIVE') {
        throw this.fastify.httpErrors.badRequest('Auction is no longer active');
      }

      if (!listing.auction) {
        throw this.fastify.httpErrors.notFound('Auction details not found');
      }

      // Lock the auction row to prevent race conditions from concurrent bids
      const lockedAuctions = await tx.$queryRaw<any[]>`
        SELECT id, "currentPrice", "endsAt", status FROM auctions 
        WHERE id = ${listing.auction.id} 
        FOR UPDATE
      `;
      const lockedAuction = lockedAuctions[0];
      if (!lockedAuction) {
        throw this.fastify.httpErrors.notFound('Auction record lock failed');
      }

      // Check bidder existence and suspension status
      const bidder = await tx.user.findUnique({
        where: { id: buyerId }
      });
      if (!bidder) {
        throw this.fastify.httpErrors.notFound('Bidder account not found');
      }
      if (!bidder.isActive) {
        throw this.fastify.httpErrors.forbidden('Your account is suspended');
      }

      // Shill bidding prevention: Seller cannot bid
      if (buyerId === listing.sellerId) {
        throw this.fastify.httpErrors.forbidden('You cannot bid on your own auction');
      }

      // Shill bidding prevention: Matching IP with seller active sessions
      if (ipAddress) {
        const sellerSessions = await tx.userSession.findMany({
          where: { userId: listing.sellerId, isRevoked: false }
        });
        const sellerIps = sellerSessions.map((s) => s.ipAddress).filter(Boolean);
        if (sellerIps.includes(ipAddress)) {
          // Log failed shill attempt in AuditLog
          await tx.auditLog.create({
            data: {
              action: 'AUCTION_BID_REJECTED',
              actorId: buyerId,
              resource: 'Auction',
              resourceId: listing.auction.id,
              metadata: {
                reason: 'Shill bidding check failed: matching IP with seller active sessions',
                ipAddress,
                bidAmount,
              }
            }
          });
          throw this.fastify.httpErrors.forbidden('Suspicious bidding activity detected (matching IP address). Self-bidding or shill bidding is strictly prohibited.');
        }
      }

      // Validate auction state and timing
      if (lockedAuction.status !== 'LIVE') {
        throw this.fastify.httpErrors.badRequest('Auction is not live');
      }

      const now = new Date();
      if (now > new Date(lockedAuction.endsAt)) {
        throw this.fastify.httpErrors.badRequest('Auction has ended');
      }

      // Validate minimum bid increment
      let currentPrice = listing.auctionStartPrice || 0;
      if (lockedAuction.currentPrice) {
        currentPrice = lockedAuction.currentPrice;
      }

      const minBid = Number(currentPrice) + Number(listing.minBidIncrement || 0);
      if (bidAmount < minBid) {
        throw this.fastify.httpErrors.badRequest(`Bid must be at least ${minBid}`);
      }

      // Find previous winning bid to notify them of outbid
      const prevWinningBid = await tx.bid.findFirst({
        where: { auctionId: listing.auction.id, isWinning: true }
      });

      if (prevWinningBid && prevWinningBid.bidderId !== buyerId) {
        await tx.notification.create({
          data: {
            userId: prevWinningBid.bidderId,
            type: 'BID_OUTBID',
            title: 'You have been outbid!',
            body: `Your bid of LKR ${Number(prevWinningBid.amount).toLocaleString()} on "${listing.title}" has been outbid by a new bid of LKR ${bidAmount.toLocaleString()}.`,
            data: { listingId: listing.id }
          }
        });
      }

      // Mark previous bids as not winning (if any)
      await tx.bid.updateMany({
        where: { auctionId: listing.auction.id, isWinning: true },
        data: { isWinning: false },
      });

      // Record the bid as winning
      const newBid = await tx.bid.create({
        data: {
          auctionId: listing.auction.id,
          bidderId: buyerId,
          amount: bidAmount,
          currency: listing.currency,
          isWinning: true,
          ipAddress
        },
        include: {
          bidder: {
            select: { id: true, username: true }
          }
        }
      });

      // Update the auction record with new current price and increment totalBids
      const updatedAuction = await tx.auction.update({
        where: { id: listing.auction.id },
        data: {
          currentPrice: bidAmount,
          totalBids: { increment: 1 },
        },
      });

      // Create AuditLog for successful bid
      await tx.auditLog.create({
        data: {
          action: 'AUCTION_BID_PLACED',
          actorId: buyerId,
          resource: 'Auction',
          resourceId: listing.auction.id,
          metadata: {
            bidId: newBid.id,
            amount: bidAmount,
            ipAddress
          }
        }
      });

      return { newBid, updatedAuction };
    });

    // Broadcast the new bid via websocket
    this.broadcastToAuction(listingId, {
      type: 'NEW_BID',
      data: {
        bid: result.newBid,
        currentPrice: result.updatedAuction.currentPrice,
        totalBids: result.updatedAuction.totalBids,
      }
    });

    return result.newBid;
  }

  /**
   * Scans for ended auctions in the database, determines winners, creates orders, and fires notifications.
   */
  async checkAndCloseAuctions() {
    const { prisma } = this.fastify;
    const now = new Date();

    const endedAuctions = await prisma.auction.findMany({
      where: {
        endsAt: { lte: now },
        status: { in: ['LIVE', 'SCHEDULED'] }
      },
      include: {
        listing: true,
        bids: {
          where: { isWinning: true },
          take: 1,
          include: {
            bidder: {
              select: { id: true, username: true }
            }
          }
        }
      }
    });

    for (const auction of endedAuctions) {
      try {
        await prisma.$transaction(async (tx) => {
          // Lock the auction row in the database
          const [lockedAuction] = await tx.$queryRaw<any[]>`
            SELECT id, status FROM auctions WHERE id = ${auction.id} FOR UPDATE
          `;

          if (!lockedAuction || lockedAuction.status === 'ENDED' || lockedAuction.status === 'SETTLED') {
            return;
          }

          const winningBid = auction.bids[0];

          if (winningBid) {
            // Settle auction with winner
            await tx.auction.update({
              where: { id: auction.id },
              data: {
                status: 'SETTLED',
                endedAt: now,
                winnerId: winningBid.bidderId,
                winningBidId: winningBid.id
              }
            });

            // Set listing status to SOLD
            await tx.listing.update({
              where: { id: auction.listingId },
              data: { status: 'SOLD' }
            });

            // Calculate fees (5% platform fee)
            const subtotal = Number(winningBid.amount);
            const platformFee = subtotal * 0.05;
            const total = subtotal + platformFee;

            // Generate unique Order Number
            const orderNumber = `ORD-AUC-${Date.now().toString().slice(-6)}-${randomBytes(2).toString('hex').toUpperCase()}`;

            // Create Order record for the winner
            await tx.order.create({
              data: {
                listingId: auction.listingId,
                buyerId: winningBid.bidderId,
                sellerId: auction.listing.sellerId,
                bidId: winningBid.id,
                orderNumber,
                status: 'PENDING_PAYMENT',
                currency: auction.currency,
                subtotal,
                platformFee,
                total,
                paymentDeadline: new Date(now.getTime() + 48 * 60 * 60 * 1000) // 48 hours deadline
              }
            });

            // Create notification for winner
            await tx.notification.create({
              data: {
                userId: winningBid.bidderId,
                type: 'AUCTION_WON',
                title: 'Auction Won!',
                body: `Congratulations! You won the auction for "${auction.listing.title}" with a bid of LKR ${subtotal.toLocaleString()}. Please complete your payment within 48 hours.`,
                data: { listingId: auction.listingId }
              }
            });

            // Create notification for seller
            await tx.notification.create({
              data: {
                userId: auction.listing.sellerId,
                type: 'AUCTION_ENDED',
                title: 'Auction Settled (Sold)',
                body: `Your auction for "${auction.listing.title}" has ended. It was sold for LKR ${subtotal.toLocaleString()} to user ${winningBid.bidder.username}.`,
                data: { listingId: auction.listingId }
              }
            });

            // Log settlement in AuditLog
            await tx.auditLog.create({
              data: {
                action: 'AUCTION_SETTLED',
                resource: 'Auction',
                resourceId: auction.id,
                metadata: {
                  winnerId: winningBid.bidderId,
                  winningBidId: winningBid.id,
                  amount: subtotal,
                  orderNumber
                }
              }
            });
          } else {
            // Mark auction as ended without winner
            await tx.auction.update({
              where: { id: auction.id },
              data: {
                status: 'ENDED',
                endedAt: now
              }
            });

            // Update listing status to EXPIRED
            await tx.listing.update({
              where: { id: auction.listingId },
              data: { status: 'EXPIRED' }
            });

            // Create notification for seller
            await tx.notification.create({
              data: {
                userId: auction.listing.sellerId,
                type: 'AUCTION_ENDED',
                title: 'Auction Ended (Unsold)',
                body: `Your auction for "${auction.listing.title}" has ended with no bids.`,
                data: { listingId: auction.listingId }
              }
            });

            // Log selection in AuditLog
            await tx.auditLog.create({
              data: {
                action: 'AUCTION_ENDED',
                resource: 'Auction',
                resourceId: auction.id,
                metadata: {
                  reason: 'No bids placed'
                }
              }
            });
          }
        });
      } catch (err) {
        this.fastify.log.error(err, `Failed to close auction ${auction.id}`);
      }
    }
  }

  // Helper to send messages to connected WS clients for a specific auction
  private broadcastToAuction(listingId: string, message: any) {
    const wss = this.fastify.websocketServer;
    if (!wss) return;

    const payload = JSON.stringify(message);
    
    for (const client of wss.clients) {
      if (client.readyState === 1 /* OPEN */) {
        if ((client as any).auctionListingId === listingId) {
          client.send(payload);
        }
      }
    }
  }

  async getAuctionState(listingId: string) {
    const { prisma } = this.fastify;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        auction: {
          include: {
            bids: {
              orderBy: { createdAt: 'desc' },
              take: 50, // recent 50 bids
              include: {
                bidder: {
                  select: { id: true, username: true }
                }
              }
            }
          }
        }
      },
    });

    if (!listing || !listing.auction) {
      throw this.fastify.httpErrors.notFound('Auction not found');
    }

    return listing.auction;
  }
}
