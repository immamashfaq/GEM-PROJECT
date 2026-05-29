import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function LiveScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.liveTagRow}>
            <View style={styles.liveDot} accessibilityLabel="Live" />
            <Text style={styles.liveTag}>LIVE AUCTIONS</Text>
          </View>
          <Text style={styles.heroTitle}>Watch & Bid{'\n'}in Real Time</Text>
          <Text style={styles.heroSub}>
            Join verified seller streams and place bids on certified gemstones from Sri Lanka.
          </Text>
        </View>

        {/* Coming soon banner */}
        <View style={styles.comingSoon}>
          <Feather name="radio" size={32} color="#C9A84C" style={{ marginBottom: 12 }} />
          <Text style={styles.comingSoonTitle}>Live Streaming</Text>
          <Text style={styles.comingSoonSub}>
            Live auction functionality will launch in Phase 2. You can currently browse and bid in
            timed auctions from the marketplace.
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/')}
            accessibilityLabel="Browse the marketplace"
          >
            <Text style={styles.ctaBtnText}>Browse Marketplace</Text>
            <Feather name="arrow-right" size={16} color="#080d1a" />
          </TouchableOpacity>
        </View>

        {/* Features coming */}
        {[
          { icon: 'video', title: 'Live Video', desc: 'Real-time HD gem showcases' },
          { icon: 'gavel', title: 'Live Bidding', desc: 'Bid as the seller presents' },
          { icon: 'message-circle', title: 'Live Chat', desc: 'Ask questions in real time' },
        ].map((feat) => (
          <View key={feat.title} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Feather name={feat.icon as any} size={20} color="#C9A84C" />
            </View>
            <View>
              <Text style={styles.featureTitle}>{feat.title}</Text>
              <Text style={styles.featureSub}>{feat.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080d1a' },
  content: { padding: 20 },
  hero: { marginBottom: 24 },
  liveTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  liveTag: { fontSize: 12, fontWeight: '700', color: '#ef4444', letterSpacing: 2 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#fff', lineHeight: 38, marginBottom: 12 },
  heroSub: { fontSize: 15, color: '#4a5568', lineHeight: 22 },
  comingSoon: {
    alignItems: 'center',
    backgroundColor: '#0e1628',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e2d4e',
    padding: 24,
    marginBottom: 24,
  },
  comingSoonTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  comingSoonSub: { fontSize: 13, color: '#4a5568', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C9A84C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ctaBtnText: { color: '#080d1a', fontWeight: '700', fontSize: 14 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0e1628',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e2d4e',
    padding: 14,
    marginBottom: 10,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 2 },
  featureSub: { fontSize: 12, color: '#4a5568' },
});
