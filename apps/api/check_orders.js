import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '../../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const prisma = new PrismaClient();

async function run() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        listing: true,
        buyer: true,
        seller: true
      }
    });

    console.log(`Total orders found: ${orders.length}`);
    orders.forEach(order => {
      console.log(`\nOrder #: ${order.orderNumber}`);
      console.log(`- ID: ${order.id}`);
      console.log(`- Listing: "${order.listing.title}"`);
      console.log(`- Buyer: ${order.buyer.username} (${order.buyer.id})`);
      console.log(`- Seller: ${order.seller.username} (${order.seller.id})`);
      console.log(`- Status: ${order.status}`);
      console.log(`- Total: ${order.total} ${order.currency}`);
    });
  } catch (error) {
    console.error('Error querying DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
