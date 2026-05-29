import type { Metadata } from 'next';
import { ListingDetailClient } from './ListingDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Gem Listing | Gem Project`,
    description: 'View certified gemstone details, seller profile, and place a bid or offer.',
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  return <ListingDetailClient id={id} />;
}
