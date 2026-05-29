import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';

export interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
}

export function useStreamChat(streamId: string) {
  const [messages, setMessagesState] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken } = useAuthStore();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const setMessages = useCallback((
    newMessages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])
  ) => {
    setMessagesState((prev) => {
      const resolved = typeof newMessages === 'function' ? newMessages(prev) : newMessages;
      const seen = new Set<string>();
      return resolved.filter((msg) => {
        if (!msg.id) return true;
        if (seen.has(msg.id)) return false;
        seen.add(msg.id);
        return true;
      });
    });
  }, []);

  useEffect(() => {
    if (!streamId) return;

    const connect = () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000/api/v1';
      const token = accessToken || (typeof window !== 'undefined' ? window.__gem_access_token__ : null);
      const wsUrl = apiUrl.replace(/^http/, 'ws') + `/streams/${streamId}/chat/stream` + (token ? `?token=${token}` : '');

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => setIsConnected(true);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'NEW_CHAT_MESSAGE') {
            setMessages((prev) => [...prev, message.data]);
          }
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.warn('WebSocket connection issue:', error);
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [streamId, accessToken]);

  return { messages, isConnected, setMessages };
}
