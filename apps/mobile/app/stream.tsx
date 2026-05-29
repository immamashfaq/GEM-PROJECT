import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';

interface ChatMessage {
  id: string;
  user: string;
  message: string;
}

export default function StreamScreen() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const [connectionState, setConnectionState] = useState<'connecting' | 'live' | 'disconnected'>('connecting');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentBid, setCurrentBid] = useState(150000);
  const [bidInput, setBidInput] = useState('');
  const chatListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    // Simulate connecting
    const timer = setTimeout(() => {
      setConnectionState('live');
      setChatMessages([
        { id: '1', user: 'Alex', message: 'Stunning sapphire!' },
        { id: '2', user: 'Sam', message: 'What is the minimum increment?' },
        { id: '3', user: 'Nimal', message: 'Can you show it under daylight?' },
      ]);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const sendChatMessage = () => {
    if (!inputText.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      user: 'You',
      message: inputText.trim(),
    };
    setChatMessages((prev) => [...prev, newMessage]);
    setInputText('');
  };

  const placeBid = () => {
    const numericBid = Number(bidInput);
    if (!numericBid || numericBid <= currentBid) {
      alert(`Bid must be higher than current bid (LKR ${currentBid.toLocaleString()})`);
      return;
    }
    setCurrentBid(numericBid);
    setBidInput('');
    alert(`Bid of LKR ${numericBid.toLocaleString()} placed successfully!`);
    
    // Add bid event to chat
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), user: 'SYSTEM', message: `New bid placed: LKR ${numericBid.toLocaleString()}` }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Video View Placeholder */}
      <View style={styles.videoContainer}>
        {connectionState === 'connecting' ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#d4af37" />
            <Text style={styles.statusText}>Connecting to stream ingest...</Text>
          </View>
        ) : (
          <View style={styles.videoPlayer}>
            <View style={styles.liveIndicator}>
              <Text style={styles.liveIndicatorText}>● LIVE</Text>
            </View>
            <Text style={styles.videoTitle}>Ceylon Sapphire Live Showcase</Text>
            <Text style={styles.videoViewerCount}>👁 28 Viewers</Text>
          </View>
        )}
      </View>

      {/* Bidding Panel */}
      <View style={styles.bidPanel}>
        <View style={styles.row}>
          <Text style={styles.bidLabel}>Current Bid:</Text>
          <Text style={styles.bidValue}>LKR {currentBid.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <TextInput
            style={styles.bidInput}
            placeholder={`Min bid > ${currentBid}`}
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            value={bidInput}
            onChangeText={setBidInput}
          />
          <TouchableOpacity style={styles.bidButton} onPress={placeBid}>
            <Text style={styles.bidButtonText}>Place Bid</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Area */}
      <FlatList
        ref={chatListRef}
        data={chatMessages}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
        renderItem={({ item }) => (
          <View style={styles.chatMessageItem}>
            <Text style={item.user === 'You' ? styles.chatUserSelf : (item.user === 'SYSTEM' ? styles.chatSystem : styles.chatUserOther)}>
              {item.user}:{' '}
            </Text>
            <Text style={styles.chatText}>{item.message}</Text>
          </View>
        )}
      />

      {/* Chat Input */}
      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.chatInput}
          placeholder="Send a message..."
          placeholderTextColor="#64748b"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendChatMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendChatMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080d1a',
  },
  videoContainer: {
    height: 250,
    backgroundColor: '#000',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: '#1e2d4e',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#d4af37',
    marginTop: 10,
    fontSize: 14,
  },
  videoPlayer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  liveIndicator: {
    position: 'absolute',
    top: 40,
    left: 16,
    backgroundColor: '#ef4444',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  liveIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  videoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  videoViewerCount: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  bidPanel: {
    backgroundColor: '#0e1628',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#1e2d4e',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bidLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  bidValue: {
    color: '#d4af37',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bidInput: {
    backgroundColor: '#080d1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e2d4e',
    color: '#fff',
    paddingHorizontal: 12,
    height: 44,
    flex: 1,
    marginRight: 10,
  },
  bidButton: {
    backgroundColor: '#d4af37',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  bidButtonText: {
    color: '#080d1a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 16,
  },
  chatMessageItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  chatUserSelf: {
    color: '#d4af37',
    fontWeight: 'bold',
    fontSize: 14,
  },
  chatUserOther: {
    color: '#60a5fa',
    fontWeight: 'bold',
    fontSize: 14,
  },
  chatSystem: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  chatText: {
    color: '#e2e8f0',
    fontSize: 14,
    flex: 1,
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#0e1628',
    borderTopWidth: 1,
    borderColor: '#1e2d4e',
    alignItems: 'center',
  },
  chatInput: {
    backgroundColor: '#080d1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e2d4e',
    color: '#fff',
    paddingHorizontal: 12,
    height: 40,
    flex: 1,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#1e2d4e',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
