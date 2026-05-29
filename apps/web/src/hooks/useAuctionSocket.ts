import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';

export interface AuctionBid {
  id: string;
  amount: number;
  currency: string;
  createdAt: string;
  bidder: {
    id: string;
    username: string;
  };
}

export interface AuctionState {
  currentPrice: number | null;
  startPrice: number;
  minBidIncrement: number;
  totalBids: number;
  bids: AuctionBid[];
}

export function useAuctionSocket(listingId: string, initialAuctionData: any) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [auctionState, setAuctionState] = useState<AuctionState>({
    currentPrice: initialAuctionData?.currentPrice ?? initialAuctionData?.startPrice ?? 0,
    startPrice: initialAuctionData?.startPrice ?? 0,
    minBidIncrement: initialAuctionData?.minBidIncrement ?? 100,
    totalBids: initialAuctionData?.totalBids ?? 0,
    bids: initialAuctionData?.bids ?? [],
  });

  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!listingId) return;

    const connect = () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000/api/v1';
      const tokenQuery = accessToken ? `?token=${encodeURIComponent(accessToken)}` : '';
      const wsUrl = apiUrl.replace(/^http/, 'ws') + `/auctions/${listingId}/stream${tokenQuery}`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'NEW_BID') {
            const { bid, currentPrice, totalBids } = message.data;
            
            setAuctionState((prev) => {
              // Avoid duplicate bids
              if (prev.bids.some((b) => b.id === bid.id)) return prev;

              return {
                ...prev,
                currentPrice,
                totalBids,
                bids: [bid, ...prev.bids],
              };
            });
          }
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [listingId, accessToken]);

  return { auctionState, isConnected };
}
