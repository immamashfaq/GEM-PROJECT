import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation } from 'expo-router';

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePlaceOrder = () => {
    if (!address) {
      alert('Please enter a shipping address');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Order Placed Successfully!');
      navigation.goBack();
    }, 2000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Secure Purchase Checkout</Text>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <Text style={styles.itemTitle}>Ceylon Blue Sapphire — 2.4 Carats</Text>
        <Text style={styles.price}>LKR 450,000</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Recipient name, address, phone number..."
          placeholderTextColor="#64748b"
          value={address}
          onChangeText={setAddress}
          multiline
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Card Number"
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          value={cardNumber}
          onChangeText={setCardNumber}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="MM/YY"
            placeholderTextColor="#64748b"
            value={expiry}
            onChangeText={setExpiry}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="CVV"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            secureTextEntry
            value={cvv}
            onChangeText={setCvv}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePlaceOrder} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pay & Confirm Order</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080d1a',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#0e1628',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e2d4e',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  price: {
    fontSize: 18,
    color: '#d4af37',
    fontWeight: 'bold',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#080d1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#1e2d4e',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  button: {
    backgroundColor: '#d4af37',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#080d1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
