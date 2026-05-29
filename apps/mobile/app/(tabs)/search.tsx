import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function searchListings(q: string) {
  if (!q.trim()) {
    const res = await fetch(`${API_URL}/listings?pageSize=20&sortBy=newest`);
    const json = await res.json();
    return json.data ?? [];
  }
  const res = await fetch(`${API_URL}/search/listings?q=${encodeURIComponent(q)}&pageSize=20`);
  const json = await res.json();
  return json.data ?? [];
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search-mobile', submittedQuery],
    queryFn: () => searchListings(submittedQuery),
  });

  const handleSubmit = () => {
    setSubmittedQuery(query);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search input */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Feather name="search" size={16} color="#4a5568" style={{ marginRight: 8 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            placeholder="Sapphires, rubies, alexandrite..."
            placeholderTextColor="#4a5568"
            style={styles.input}
            returnKeyType="search"
            autoFocus
            accessibilityLabel="Search gemstones"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => { setQuery(''); setSubmittedQuery(''); }}
              accessibilityLabel="Clear search"
            >
              <Feather name="x" size={16} color="#4a5568" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color="#C9A84C" size="large" />
        </View>
      )}

      {!isLoading && results.length === 0 && submittedQuery.length > 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>💎</Text>
          <Text style={styles.emptyText}>No gems found for "{submittedQuery}"</Text>
        </View>
      )}

      {!isLoading && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={styles.resultCount}>
                {results.length} gem{results.length !== 1 ? 's' : ''} found
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/listings/${item.id}`)}
              accessibilityLabel={`View ${item.title}`}
              accessibilityRole="button"
            >
              <View style={styles.imageBox}>
                <Text style={styles.emoji}>💎</Text>
                {item.isCertified && (
                  <View style={styles.certBadge}>
                    <Text style={styles.certText}>Certified</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.gemType}>{item.gemType}</Text>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.price}>
                  {item.currency === 'USD' ? '$' : 'LKR '}
                  {(item.fixedPrice ?? item.auctionStartPrice ?? 0).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080d1a' },
  searchRow: { paddingHorizontal: 16, paddingVertical: 12 },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0f1e',
    borderWidth: 1,
    borderColor: '#1e2d4e',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  input: { flex: 1, color: '#f0f4ff', fontSize: 14 },
  list: { paddingHorizontal: 12, paddingBottom: 20 },
  row: { gap: 12, marginBottom: 12 },
  resultCount: { color: '#4a5568', fontSize: 13, marginBottom: 12, paddingHorizontal: 4 },
  card: {
    flex: 1,
    backgroundColor: '#0e1628',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e2d4e',
    overflow: 'hidden',
  },
  imageBox: {
    height: 120,
    backgroundColor: '#0a0f1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 44, opacity: 0.3 },
  certBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  certText: { fontSize: 9, color: '#34d399', fontWeight: '700' },
  cardInfo: { padding: 10 },
  gemType: { fontSize: 9, fontWeight: '700', color: '#C9A84C', textTransform: 'uppercase', marginBottom: 3 },
  title: { fontSize: 12, fontWeight: '600', color: '#f0f4ff', marginBottom: 5, lineHeight: 16 },
  price: { fontSize: 13, fontWeight: '800', color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: '#4a5568', fontSize: 14, textAlign: 'center' },
});
