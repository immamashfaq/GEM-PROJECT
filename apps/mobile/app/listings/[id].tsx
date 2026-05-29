import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function fetchListing(id: string) {
  const res = await fetch(`${API_URL}/listings/${id}`);
  if (!res.ok) throw new Error('Failed to fetch');
  const json = await res.json();
  return json.data;
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['listing-mobile', id],
    queryFn: () => fetchListing(id),
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#C9A84C" size="large" />
      </View>
    );
  }

  if (isError || !listing) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>Listing not found</Text>
        <TouchableOpacity style={styles.btnOutline} onPress={() => router.back()}>
          <Text style={styles.btnOutlineText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const price = listing.fixedPrice ?? listing.auctionStartPrice ?? listing.negotiablePrice ?? 0;
  const isAuction = listing.listingType === 'TIMED_AUCTION' || listing.listingType === 'LIVE_AUCTION';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Placeholder Image */}
        <View style={styles.imageBox}>
          <Text style={styles.emoji}>💎</Text>
          <View style={styles.imageOverlay}>
            {listing.isCertified && (
              <View style={styles.badgeCert}>
                <Feather name="award" size={12} color="#34d399" />
                <Text style={styles.badgeCertText}>Certified</Text>
              </View>
            )}
            {listing.naturalStatus === 'NATURAL' && (
              <View style={styles.badgeNat}>
                <Text style={styles.badgeNatText}>Natural</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {/* Title & Price */}
          <Text style={styles.gemType}>{listing.gemType} {listing.variety ? `· ${listing.variety}` : ''}</Text>
          <Text style={styles.title}>{listing.title}</Text>
          
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>{isAuction ? 'Current Bid' : 'Price'}</Text>
              <Text style={styles.price}>
                {listing.currency === 'USD' ? '$' : 'LKR '}
                {price.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity style={styles.watchBtn} accessibilityLabel="Save to watchlist">
              <Feather name="heart" size={20} color="#f0f4ff" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionBtns}>
            {listing.listingType === 'FIXED_PRICE' && (
              <TouchableOpacity style={styles.btnGold} accessibilityLabel="Buy now">
                <Text style={styles.btnGoldText}>Buy Now</Text>
              </TouchableOpacity>
            )}
            {listing.listingType === 'NEGOTIABLE' && (
              <TouchableOpacity style={styles.btnGold} accessibilityLabel="Make an offer">
                <Text style={styles.btnGoldText}>Make Offer</Text>
              </TouchableOpacity>
            )}
            {isAuction && (
              <TouchableOpacity style={styles.btnGold} accessibilityLabel="Place bid">
                <Text style={styles.btnGoldText}>Place Bid</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Specs */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Specifications</Text>
            <View style={styles.specGrid}>
              {[
                { label: 'Weight', value: listing.caratWeight ? `${listing.caratWeight} ct` : null },
                { label: 'Color', value: listing.color },
                { label: 'Clarity', value: listing.clarity },
                { label: 'Cut', value: listing.cut },
                { label: 'Shape', value: listing.shape },
                { label: 'Treatment', value: listing.treatment },
                { label: 'Origin', value: listing.originCountry },
              ].filter(s => s.value).map(s => (
                <View key={s.label} style={styles.specItem}>
                  <Text style={styles.specLabel}>{s.label}</Text>
                  <Text style={styles.specValue}>{s.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Seller */}
          {listing.seller && (
            <View style={styles.card}>
              <View style={styles.sellerRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{listing.seller.username?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={styles.sellerInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.sellerName}>{listing.seller.fullName ?? listing.seller.username}</Text>
                    {listing.sellerProfile?.isVerified && (
                      <Feather name="check-circle" size={14} color="#C9A84C" />
                    )}
                  </View>
                  {listing.sellerProfile?.averageRating && (
                    <Text style={styles.sellerRating}>
                      ★ {Number(listing.sellerProfile.averageRating).toFixed(1)} ({listing.sellerProfile.totalReviews} reviews)
                    </Text>
                  )}
                </View>
                <TouchableOpacity style={styles.btnOutlineSmall}>
                  <Text style={styles.btnOutlineSmallText}>Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080d1a' },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorEmoji: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 18, color: '#f0f4ff', fontWeight: '600', marginBottom: 20 },
  btnOutline: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1e2d4e' },
  btnOutlineText: { color: '#8a9cc4', fontWeight: '600' },
  imageBox: { height: 300, backgroundColor: '#0a0f1e', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  emoji: { fontSize: 100, opacity: 0.1 },
  imageOverlay: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', gap: 8 },
  badgeCert: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeCertText: { color: '#34d399', fontSize: 10, fontWeight: '700' },
  badgeNat: { backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeNatText: { color: '#60a5fa', fontSize: 10, fontWeight: '700' },
  content: { padding: 16 },
  gemType: { fontSize: 11, fontWeight: '700', color: '#C9A84C', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16, lineHeight: 26 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  priceLabel: { fontSize: 12, color: '#4a5568', marginBottom: 4 },
  price: { fontSize: 24, fontWeight: '800', color: '#fff' },
  watchBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0e1628', borderWidth: 1, borderColor: '#1e2d4e', alignItems: 'center', justifyContent: 'center' },
  actionBtns: { marginBottom: 24 },
  btnGold: { backgroundColor: '#C9A84C', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnGoldText: { color: '#080d1a', fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: '#0e1628', borderRadius: 16, borderWidth: 1, borderColor: '#1e2d4e', padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 12 },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  specItem: { width: '47%' },
  specLabel: { fontSize: 11, color: '#4a5568', marginBottom: 2 },
  specValue: { fontSize: 13, color: '#f0f4ff', fontWeight: '500' },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(201,168,76,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#C9A84C', fontSize: 16, fontWeight: '700' },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  sellerRating: { fontSize: 12, color: '#C9A84C', marginTop: 2 },
  btnOutlineSmall: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#1e2d4e' },
  btnOutlineSmallText: { fontSize: 12, color: '#8a9cc4', fontWeight: '600' },
  description: { fontSize: 14, color: '#8a9cc4', lineHeight: 22 },
});
