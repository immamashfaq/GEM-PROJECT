import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function fetchFeatured() {
  const res = await fetch(`${API_URL}/listings?isFeatured=true&pageSize=6`);
  const json = await res.json();
  return json.data ?? [];
}

async function fetchCategories() {
  const res = await fetch(`${API_URL}/listings/categories`);
  const json = await res.json();
  return json.data ?? [];
}

export default function HomeScreen() {
  const router = useRouter();
  const { data: featured = [], isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-mobile'],
    queryFn: fetchFeatured,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories-mobile'],
    queryFn: fetchCategories,
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              <Text style={{ color: '#C9A84C' }}>Gem</Text> Project
            </Text>
            <Text style={styles.subtitle}>Sri Lanka's Gem Marketplace</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/search')}
            style={styles.searchIconBtn}
            accessibilityLabel="Search gems"
          >
            <Feather name="search" size={20} color="#C9A84C" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <TouchableOpacity
          onPress={() => router.push('/search')}
          style={styles.searchBar}
          accessibilityLabel="Search for gemstones"
          accessibilityRole="button"
        >
          <Feather name="search" size={18} color="#4a5568" />
          <Text style={styles.searchPlaceholder}>Search sapphires, rubies...</Text>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.slice(0, 10).map((cat: any) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => router.push(`/search?categoryId=${cat.id}`)}
                style={styles.categoryChip}
                accessibilityLabel={`Browse ${cat.name}`}
              >
                <Text style={styles.categoryEmoji}>💎</Text>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured gems */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Gems</Text>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {featuredLoading ? (
            <View style={styles.loadingRow}>
              {[1, 2].map((i) => (
                <View key={i} style={styles.skeletonCard} />
              ))}
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featured.map((listing: any) => (
                <TouchableOpacity
                  key={listing.id}
                  style={styles.listingCard}
                  onPress={() => router.push(`/listings/${listing.id}`)}
                  accessibilityLabel={`View ${listing.title}`}
                  accessibilityRole="button"
                >
                  {/* Placeholder gem image */}
                  <View style={styles.listingImageBox}>
                    <Text style={styles.listingEmoji}>💎</Text>
                    {listing.isCertified && (
                      <View style={styles.certBadge}>
                        <Text style={styles.certText}>Cert</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.listingInfo}>
                    <Text style={styles.listingGemType}>{listing.gemType}</Text>
                    <Text style={styles.listingTitle} numberOfLines={2}>
                      {listing.title}
                    </Text>
                    <Text style={styles.listingPrice}>
                      {listing.currency === 'USD' ? '$' : 'LKR '}
                      {(listing.fixedPrice ?? listing.auctionStartPrice ?? 0).toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Live auction banner */}
        <TouchableOpacity
          style={styles.liveBanner}
          onPress={() => router.push('/live')}
          accessibilityLabel="Watch live gem auctions"
          accessibilityRole="button"
        >
          <View style={styles.liveDot} accessibilityLabel="Live" />
          <Text style={styles.liveBannerTitle}>LIVE Auctions</Text>
          <Text style={styles.liveBannerSub}>Watch and bid in real time</Text>
          <Feather name="arrow-right" size={16} color="#C9A84C" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080d1a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  logo: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: '#4a5568', marginTop: 2 },
  searchIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0e1628',
    borderWidth: 1,
    borderColor: '#1e2d4e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0a0f1e',
    borderWidth: 1,
    borderColor: '#1e2d4e',
  },
  searchPlaceholder: { fontSize: 14, color: '#4a5568' },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', paddingHorizontal: 16, marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#C9A84C', fontWeight: '600' },
  categoryScroll: { paddingLeft: 16 },
  categoryChip: {
    alignItems: 'center',
    marginRight: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#0e1628',
    borderWidth: 1,
    borderColor: '#1e2d4e',
    minWidth: 72,
  },
  categoryEmoji: { fontSize: 22, marginBottom: 4 },
  categoryName: { fontSize: 10, fontWeight: '600', color: '#f0f4ff', textAlign: 'center' },
  loadingRow: { flexDirection: 'row', paddingLeft: 16, gap: 12 },
  skeletonCard: { width: 180, height: 240, borderRadius: 12, backgroundColor: '#0e1628' },
  listingCard: {
    width: 180,
    marginLeft: 16,
    borderRadius: 12,
    backgroundColor: '#0e1628',
    borderWidth: 1,
    borderColor: '#1e2d4e',
    overflow: 'hidden',
  },
  listingImageBox: {
    height: 140,
    backgroundColor: '#0a0f1e',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  listingEmoji: { fontSize: 52, opacity: 0.3 },
  certBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  certText: { fontSize: 9, color: '#34d399', fontWeight: '700' },
  listingInfo: { padding: 10 },
  listingGemType: { fontSize: 10, fontWeight: '600', color: '#C9A84C', textTransform: 'uppercase', marginBottom: 3 },
  listingTitle: { fontSize: 12, fontWeight: '600', color: '#f0f4ff', marginBottom: 6, lineHeight: 16 },
  listingPrice: { fontSize: 14, fontWeight: '800', color: '#fff' },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#0e1628',
    borderWidth: 1,
    borderColor: '#1e2d4e',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  liveBannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  liveBannerSub: { fontSize: 12, color: '#4a5568' },
});
