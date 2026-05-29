import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function WatchlistScreen() {
  const router = useRouter();

  // In Phase 1 on mobile, guide to log in via web or mobile auth
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Watchlist</Text>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>❤️</Text>
        <Text style={styles.emptyTitle}>No saved gems yet</Text>
        <Text style={styles.emptySub}>
          Tap the heart icon on any listing to save gems to your watchlist.
        </Text>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.push('/')}
          accessibilityLabel="Browse gems"
        >
          <Text style={styles.ctaBtnText}>Browse Gems</Text>
          <Feather name="arrow-right" size={16} color="#080d1a" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push('/auth/login' as any)}
          accessibilityLabel="Log in to view your watchlist"
        >
          <Text style={styles.loginBtnText}>Log in to sync watchlist</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080d1a' },
  header: { padding: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#4a5568', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C9A84C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  ctaBtnText: { color: '#080d1a', fontWeight: '700', fontSize: 14 },
  loginBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e2d4e',
  },
  loginBtnText: { color: '#8a9cc4', fontWeight: '600', fontSize: 13 },
});
