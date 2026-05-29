import { loadEnv } from './lib/env.js';

// Load environment variables from .env BEFORE any other imports!
loadEnv();

async function main() {
  const { buildServer } = await import('./server.js');
  
  const PORT = parseInt(process.env['PORT'] ?? '4000', 10);
  const HOST = process.env['HOST'] ?? '0.0.0.0';
  
  const server = await buildServer();

  let intervalId: NodeJS.Timeout | undefined;

  try {
    await server.listen({ port: PORT, host: HOST });
    server.log.info(`🚀 Gem Project API running on http://${HOST}:${PORT}`);

    // Start background auction check interval
    const { AuctionService } = await import('./services/auction.service.js');
    const auctionService = new AuctionService(server);
    intervalId = setInterval(async () => {
      try {
        await auctionService.checkAndCloseAuctions();
      } catch (err) {
        server.log.error(err, 'Failed running background checkAndCloseAuctions');
      }
    }, 15000);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    server.log.info(`Received ${signal}, shutting down gracefully...`);
    if (intervalId) {
      clearInterval(intervalId);
    }
    await server.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
