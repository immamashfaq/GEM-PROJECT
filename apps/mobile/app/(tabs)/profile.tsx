import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();

  // In Phase 1, show guest view with login/register CTA
  const menuItems = [
    { icon: 'help-circle', label: 'How It Works', href: null },
    { icon: 'shield', label: 'Buyer Protection', href: null },
    { icon: 'info', label: 'About Gem Project', href: null },
    { icon: 'mail', label: 'Contact Support', href: null },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Guest banner */}
        <View style={styles.guestBanner}>
          <View style={styles.avatar}>
            <Feather name="user" size={28} color="#C9A84C" />
          </View>
          <Text style={styles.guestTitle}>Join Gem Project</Text>
          <Text style={styles.guestSub}>
            Log in or register to save gems, track orders, and bid in auctions.
          </Text>
          <View style={styles.authBtns}>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push('/auth/login' as any)}
              accessibilityLabel="Log in"
            >
              <Text style={styles.loginBtnText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => router.push('/auth/register' as any)}
              accessibilityLabel="Create an account"
            >
              <Text style={styles.registerBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              accessibilityLabel={item.label}
            >
              <View style={styles.menuIconBox}>
                <Feather name={item.icon as any} size={18} color="#4a5568" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color="#4a5568" />
            </TouchableOpacity>
          ))}
        </View>

        {/* App info */}
        <Text style={styles.appVersion}>Gem Project v1.0.0 · Made in Sri Lanka 🇱🇰</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080d1a' },
  header: { padding: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  guestBanner: {
    margin: 16,
    padding: 20,
    backgroundColor: '#0e1628',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e2d4e',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(201,168,76,0.2)',
    marginBottom: 12,
  },
  guestTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 6 },
  guestSub: { fontSize: 13, color: '#4a5568', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  authBtns: { flexDirection: 'row', gap: 10, width: '100%' },
  loginBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e2d4e',
    alignItems: 'center',
  },
  loginBtnText: { color: '#8a9cc4', fontWeight: '600', fontSize: 14 },
  registerBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#C9A84C',
    alignItems: 'center',
  },
  registerBtnText: { color: '#080d1a', fontWeight: '700', fontSize: 14 },
  menu: { marginHorizontal: 16, marginTop: 8 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#0e1628',
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#0e1628',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, color: '#8a9cc4', fontWeight: '500' },
  appVersion: { textAlign: 'center', fontSize: 12, color: '#1e2d4e', marginTop: 32, marginBottom: 20 },
});
