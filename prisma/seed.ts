/**
 * Gem Project — Database Seed
 * Seeds: gem categories, treatments, admin user, test buyer, test seller with listings
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const GEM_CATEGORIES = [
  { name: 'Blue Sapphire', slug: 'blue-sapphire', description: 'Classic blue corundum — Sri Lanka\'s most celebrated gem' },
  { name: 'Star Sapphire', slug: 'star-sapphire', description: 'Asteriated sapphire displaying a six-rayed star' },
  { name: 'Ruby', slug: 'ruby', description: 'Red corundum — the king of precious gems' },
  { name: 'Alexandrite', slug: 'alexandrite', description: 'Color-change chrysoberyl — rare and highly prized' },
  { name: "Cat's Eye Chrysoberyl", slug: 'cats-eye-chrysoberyl', description: 'Chatoyant chrysoberyl with a silky eye effect' },
  { name: 'Yellow Sapphire', slug: 'yellow-sapphire', description: 'Golden-yellow corundum — popular in Sri Lanka' },
  { name: 'Pink Sapphire', slug: 'pink-sapphire', description: 'Delicate pink corundum — feminine and elegant' },
  { name: 'Spinel', slug: 'spinel', description: 'Often mistaken for ruby — comes in many colors' },
  { name: 'Tourmaline', slug: 'tourmaline', description: 'Vibrant multi-color gemstone family' },
  { name: 'Aquamarine', slug: 'aquamarine', description: 'Sea-blue beryl — calm and elegant' },
  { name: 'Emerald', slug: 'emerald', description: 'Vivid green beryl — the most prized beryl' },
  { name: 'Garnet', slug: 'garnet', description: 'Deep red to orange-red iron silicate' },
  { name: 'Zircon', slug: 'zircon', description: 'High-dispersion natural gemstone — brilliant fire' },
  { name: 'Moonstone', slug: 'moonstone', description: 'Feldspar with adularescence — otherworldly glow' },
  { name: 'Amethyst', slug: 'amethyst', description: 'Purple quartz — regal and affordable' },
  { name: 'Topaz', slug: 'topaz', description: 'Brilliant silicate — many colors including imperial orange' },
  { name: 'Peridot', slug: 'peridot', description: 'Olive-green olivine — the gem of the sun' },
  { name: 'Other', slug: 'other', description: 'All other gemstone varieties' },
];

const GEM_TREATMENTS = [
  { name: 'None (Unheated)', slug: 'unheated', description: 'No enhancement — highest market premium' },
  { name: 'Heated', slug: 'heated', description: 'Standard heat treatment to improve color and clarity' },
  { name: 'Fracture Filled', slug: 'fracture-filled', description: 'Fissures filled with glass or resin' },
  { name: 'Beryllium Treated', slug: 'beryllium-treated', description: 'Diffused with beryllium for color change' },
  { name: 'Glass Filled', slug: 'glass-filled', description: 'Significant glass filling — major enhancement' },
  { name: 'Oiling/Resin', slug: 'oiling-resin', description: 'Oil or resin filling — common in emeralds' },
  { name: 'Irradiated', slug: 'irradiated', description: 'Color altered through radiation' },
  { name: 'Surface Coating', slug: 'surface-coating', description: 'Surface layer applied for color/luster' },
  { name: 'Unknown', slug: 'unknown', description: 'Treatment status not determined' },
];

async function main() {
  console.info('🌱 Starting database seed...');

  // ------------------------------------------------------------------
  // Gem Categories
  // ------------------------------------------------------------------
  console.info('  Creating gem categories...');
  for (let i = 0; i < GEM_CATEGORIES.length; i++) {
    const cat = GEM_CATEGORIES[i];
    if (!cat) continue;
    await prisma.gemCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, sortOrder: i },
    });
  }
  console.info(`  ✓ ${GEM_CATEGORIES.length} gem categories created`);

  // ------------------------------------------------------------------
  // Gem Treatments
  // ------------------------------------------------------------------
  console.info('  Creating gem treatments...');
  for (const treatment of GEM_TREATMENTS) {
    await prisma.gemTreatment.upsert({
      where: { slug: treatment.slug },
      update: {},
      create: treatment,
    });
  }
  console.info(`  ✓ ${GEM_TREATMENTS.length} gem treatments created`);

  // ------------------------------------------------------------------
  // Admin User
  // ------------------------------------------------------------------
  console.info('  Creating admin user...');
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gemproject.lk' },
    update: {},
    create: {
      email: 'admin@gemproject.lk',
      username: 'admin',
      passwordHash: adminPasswordHash,
      fullName: 'Gem Project Admin',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });
  console.info(`  ✓ Admin: ${admin.email}`);

  // ------------------------------------------------------------------
  // Test Buyer
  // ------------------------------------------------------------------
  console.info('  Creating test buyer...');
  const buyerPasswordHash = await bcrypt.hash('Buyer@123456', 12);
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@test.lk' },
    update: {},
    create: {
      email: 'buyer@test.lk',
      username: 'testbuyer',
      passwordHash: buyerPasswordHash,
      fullName: 'Nimal Perera',
      role: 'BUYER',
      isEmailVerified: true,
    },
  });
  console.info(`  ✓ Buyer: ${buyer.email}`);

  // ------------------------------------------------------------------
  // Test Seller (Verified)
  // ------------------------------------------------------------------
  console.info('  Creating test verified seller...');
  const sellerPasswordHash = await bcrypt.hash('Seller@123456', 12);
  const seller = await prisma.user.upsert({
    where: { email: 'seller@test.lk' },
    update: { fullName: 'Immam Ashfaq' },
    create: {
      email: 'seller@test.lk',
      username: 'ratnapuragems',
      passwordHash: sellerPasswordHash,
      fullName: 'Immam Ashfaq',
      role: 'VERIFIED_SELLER',
      isEmailVerified: true,
      sellerProfile: {
        create: {
          businessName: 'Ratnapura Gems & Minerals',
          bio: 'Established gem dealer from Ratnapura with 20+ years of experience in natural unheated sapphires and other Ceylon gemstones.',
          location: 'Ratnapura, Sri Lanka',
          phone: '+94771234567',
          kycStatus: 'APPROVED',
          isVerified: true,
          verifiedAt: new Date(),
          averageRating: 4.8,
          totalReviews: 47,
          completedSales: 52,
          responseRatePercent: 96.5,
        },
      },
    },
  });
  console.info(`  ✓ Seller: ${seller.email}`);

  // ------------------------------------------------------------------
  // Sample Listings
  // ------------------------------------------------------------------
  console.info('  Creating sample listings...');
  
  const sapphireCategory = await prisma.gemCategory.findUnique({
    where: { slug: 'blue-sapphire' },
  });
  const rubyCategory = await prisma.gemCategory.findUnique({
    where: { slug: 'ruby' },
  });
  const yellowSapphireCategory = await prisma.gemCategory.findUnique({
    where: { slug: 'yellow-sapphire' },
  });

  if (!sapphireCategory || !rubyCategory || !yellowSapphireCategory) {
    throw new Error('Categories not found — ensure category seed ran first');
  }

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: seller.id },
  });

  if (!sellerProfile) throw new Error('Seller profile not found');

  // Listing 1: Blue Sapphire fixed price
  await prisma.listing.upsert({
    where: { slug: 'natural-ceylon-blue-sapphire-3-45ct-unheated' },
    update: {},
    create: {
      sellerId: seller.id,
      categoryId: sapphireCategory.id,
      title: 'Natural Ceylon Blue Sapphire 3.45ct Unheated',
      description:
        'Exceptionally fine natural unheated Ceylon blue sapphire from Ratnapura. Deep royal blue color with excellent clarity. Accompanied by a GIA certificate confirming natural origin and no heat treatment. This is a collector-grade specimen suitable for fine jewelry mounting.',
      slug: 'natural-ceylon-blue-sapphire-3-45ct-unheated',
      gemType: 'Sapphire',
      variety: 'Blue Sapphire',
      originCountry: 'Sri Lanka',
      originRegion: 'Ratnapura',
      caratWeight: 3.45,
      color: 'Royal Blue',
      clarity: 'Eye Clean',
      cut: 'Oval Mixed',
      shape: 'Oval',
      dimensionsMm: '9.2 × 7.8 × 5.1',
      treatment: 'None (Unheated)',
      isHeatTreated: false,
      transparency: 'Transparent',
      refractiveIndex: 1.762,
      specificGravity: 4.0,
      hardness: 9.0,
      isCertified: true,
      naturalStatus: 'NATURAL',
      mountedStatus: 'LOOSE',
      currency: 'USD',
      listingType: 'FIXED_PRICE',
      fixedPrice: 4500.0,
      status: 'ACTIVE',
      isFeatured: true,
      publishedAt: new Date(),
      viewCount: 234,
      watchCount: 18,
      favoriteCount: 12,
    },
  });

  // Listing 2: Ruby negotiable
  await prisma.listing.upsert({
    where: { slug: 'burma-red-ruby-2-1ct-certified-gia' },
    update: {},
    create: {
      sellerId: seller.id,
      categoryId: rubyCategory.id,
      title: 'Natural Burma Red Ruby 2.10ct — GIA Certified',
      description:
        'A stunning natural Burma ruby with pigeon blood red color. GIA certified with heat treatment as declared. Excellent brilliance with strong fluorescence. Perfect for a high-end ring or pendant. Price is negotiable for serious buyers.',
      slug: 'burma-red-ruby-2-1ct-certified-gia',
      gemType: 'Ruby',
      variety: 'Pigeon Blood Ruby',
      originCountry: 'Myanmar',
      caratWeight: 2.1,
      color: 'Pigeon Blood Red',
      clarity: 'Slightly Included',
      cut: 'Cushion Mixed',
      shape: 'Cushion',
      dimensionsMm: '8.0 × 6.5 × 4.8',
      treatment: 'Heated',
      isHeatTreated: true,
      transparency: 'Transparent',
      isCertified: true,
      naturalStatus: 'NATURAL',
      mountedStatus: 'LOOSE',
      currency: 'USD',
      listingType: 'NEGOTIABLE',
      negotiablePrice: 8500.0,
      minAcceptableOffer: 7200.0,
      status: 'ACTIVE',
      publishedAt: new Date(),
      viewCount: 89,
      watchCount: 6,
      favoriteCount: 4,
    },
  });

  // Listing 3: Yellow Sapphire auction
  const auctionEnd = new Date();
  auctionEnd.setDate(auctionEnd.getDate() + 3);
  
  const auctionListing = await prisma.listing.upsert({
    where: { slug: 'golden-ceylon-yellow-sapphire-5-2ct-unheated-auction' },
    update: {},
    create: {
      sellerId: seller.id,
      categoryId: yellowSapphireCategory.id,
      title: 'Golden Ceylon Yellow Sapphire 5.20ct Unheated — Live Auction',
      description:
        'Rare untreated golden yellow sapphire from Elahera, Sri Lanka. Vivid lemon-to-golden yellow with exceptional transparency. Perfect for astrological use or fine jewelry. NGJA certified. Bidding starts at an attractive price.',
      slug: 'golden-ceylon-yellow-sapphire-5-2ct-unheated-auction',
      gemType: 'Sapphire',
      variety: 'Yellow Sapphire',
      originCountry: 'Sri Lanka',
      originRegion: 'Elahera',
      caratWeight: 5.2,
      color: 'Golden Yellow',
      clarity: 'Eye Clean',
      cut: 'Oval Brilliant',
      shape: 'Oval',
      dimensionsMm: '11.5 × 9.2 × 6.4',
      treatment: 'None (Unheated)',
      isHeatTreated: false,
      transparency: 'Transparent',
      isCertified: true,
      naturalStatus: 'NATURAL',
      mountedStatus: 'LOOSE',
      currency: 'LKR',
      listingType: 'TIMED_AUCTION',
      auctionStartPrice: 150000.0,
      reservePrice: 200000.0,
      minBidIncrement: 5000.0,
      auctionStartsAt: new Date(),
      auctionEndsAt: auctionEnd,
      autoExtend: true,
      status: 'ACTIVE',
      isFeatured: true,
      publishedAt: new Date(),
      viewCount: 412,
      watchCount: 31,
      favoriteCount: 19,
    },
  });

  // Create the Auction record for listing 3
  await prisma.auction.upsert({
    where: { listingId: auctionListing.id },
    update: {},
    create: {
      listingId: auctionListing.id,
      status: 'LIVE',
      startPrice: 150000.0,
      currentPrice: 165000.0,
      reservePrice: 200000.0,
      minBidIncrement: 5000.0,
      currency: 'LKR',
      startsAt: new Date(),
      endsAt: auctionEnd,
      totalBids: 3,
    },
  });

  console.info('  ✓ 3 sample listings created');

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  const counts = {
    categories: await prisma.gemCategory.count(),
    treatments: await prisma.gemTreatment.count(),
    users: await prisma.user.count(),
    listings: await prisma.listing.count(),
  };

  console.info('\n🎉 Seed complete!');
  console.info('  Database state:');
  console.info(`    Categories: ${counts.categories}`);
  console.info(`    Treatments: ${counts.treatments}`);
  console.info(`    Users:      ${counts.users}`);
  console.info(`    Listings:   ${counts.listings}`);
  console.info('\n  Test credentials:');
  console.info('    Admin:  admin@gemproject.lk / Admin@123456');
  console.info('    Buyer:  buyer@test.lk       / Buyer@123456');
  console.info('    Seller: seller@test.lk      / Seller@123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
