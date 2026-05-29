'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useStreamChat } from '@/hooks/useStreamChat';
import { useState, useEffect, useRef } from 'react';
import { Users, Send, AlertTriangle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import Hls from 'hls.js';
import Link from 'next/link';

function LiveVideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let hls: Hls | null = null;
    const video = videoRef.current;
    if (!video || !src) return;

    const initPlayer = () => {
      if (Hls.isSupported()) {
        hls = new Hls({
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 20,
          manifestLoadingRetryDelay: 3000,
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsReady(true);
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR || data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT) {
            setIsReady(false);
            setHasError(true);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          setIsReady(true);
          video.play().catch(() => {});
        });
        video.addEventListener('error', () => {
          setIsReady(false);
          setHasError(true);
        });
      }
    };

    initPlayer();

    // Check availability and poll if returns 404
    const checkInterval = setInterval(() => {
      if (!isReady) {
        if (hls) {
          hls.loadSource(src);
        } else {
          video.src = src;
        }
      }
    }, 5000);

    return () => {
      clearInterval(checkInterval);
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, isReady]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        controls
        muted
        playsInline
        className={`w-full h-full object-contain ${isReady ? 'block' : 'hidden'}`}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center flex-col bg-black">
          <div className="w-16 h-16 border-4 border-[#1e2d4e] border-t-gold-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-400 text-sm font-semibold tracking-wider">
            {hasError ? 'Waiting for Broadcast Feed...' : 'Loading Live Stream...'}
          </p>
          <p className="text-gray-600 text-xs mt-1">Make sure you have started streaming in OBS</p>
        </div>
      )}
    </div>
  );
}

export default function StreamViewerPage() {
  const { id } = useParams() as { id: string };
  const { user, isAuthenticated } = useAuthStore();
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { data: stream, isLoading, isError } = useQuery({
    queryKey: ['stream', id],
    queryFn: async () => {
      const res = await api.streams.getById(id);
      return res.data.data;
    },
  });

  const { data: initialChatHistory } = useQuery({
    queryKey: ['stream-chat', id],
    queryFn: async () => {
      const res = await api.streams.getChatHistory(id);
      return res.data.data;
    },
  });

  const { messages, isConnected, setMessages } = useStreamChat(id);

  // Initialize messages once history is loaded
  useEffect(() => {
    if (initialChatHistory && messages.length === 0) {
      setMessages(initialChatHistory);
    }
  }, [initialChatHistory]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !isAuthenticated) return;
    
    const messageText = chatInput;
    setChatInput('');

    try {
      await api.client.post(`/streams/${id}/chat`, { message: messageText });
    } catch (err) {
      console.error('Failed to send message', err);
      setChatInput(messageText);
    }
  };

  if (isLoading) return <div className="pt-24 min-h-screen" />;

  if (isError || !stream) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center card-gem p-8">
          <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Stream not found</h2>
          <p className="text-gray-400 mb-6">This broadcast may have ended or does not exist.</p>
          <Link href="/live" className="btn-gold">Back to Streams</Link>
        </div>
      </div>
    );
  }

  const isStreamEnded = stream.status === 'ENDED';

  return (
    <div className="pt-20 min-h-screen flex flex-col md:flex-row bg-[#02040a]">
      {/* LEFT: Video Player Area */}
      <div className="flex-1 flex flex-col">
        {/* Real Video Player Container */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center border-b border-[#1e2d4e]">
          {isStreamEnded ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Broadcast Ended</h2>
              <p className="text-gray-400">Thanks for watching.</p>
            </div>
          ) : (
            <LiveVideoPlayer src={stream.playbackUrl} />
          )}
        </div>

        {/* Stream Info */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-2">{stream.title}</h1>
          <div className="flex items-center gap-6 text-sm text-gray-400 mb-6 border-b border-[#1e2d4e] pb-6">
            <span className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 font-bold">
                {stream.sellerProfile.user.username[0].toUpperCase()}
              </div>
              <span className="text-white">{stream.sellerProfile.user.username}</span>
            </span>
            <span className="flex items-center gap-1">
              <Users size={16} />
              {stream._count.viewers} watching
            </span>
            <span>Started {formatRelativeTime(stream.startedAt)}</span>
          </div>
          
          <p className="text-gray-300 text-sm">{stream.description}</p>
        </div>
      </div>

      {/* RIGHT: Chat Sidebar */}
      <div className="w-full md:w-80 lg:w-96 bg-[#0a0f1e] border-l border-[#1e2d4e] flex flex-col h-[calc(100vh-80px)] shrink-0">
        <div className="p-4 border-b border-[#1e2d4e] flex justify-between items-center">
          <h2 className="text-white font-semibold flex items-center gap-2">
            Live Chat
            {isConnected && !isStreamEnded && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="Connected" />
            )}
          </h2>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 text-xs mt-10">Welcome to the chat room!</p>
          ) : (
            messages.map((msg, i) => (
              <div key={msg.id || i} className="text-sm">
                <span className={`font-semibold mr-2 ${msg.user.id === stream.sellerProfile.user.id ? 'text-gold-400' : 'text-blue-400'}`}>
                  {msg.user.username}
                  {msg.user.id === stream.sellerProfile.user.id && (
                    <span className="bg-gold-500/20 text-gold-500 text-[9px] uppercase px-1 ml-1 rounded">Host</span>
                  )}
                </span>
                <span className="text-gray-200">{msg.message}</span>
              </div>
            ))
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-[#1e2d4e] bg-[#050810]">
          {isStreamEnded ? (
            <div className="text-center text-gray-500 text-sm">Chat is closed</div>
          ) : !isAuthenticated ? (
            <div className="text-center">
              <Link href="/auth/login" className="text-gold-400 hover:underline text-sm">Log in</Link>
              <span className="text-gray-500 text-sm"> to chat</span>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input 
                type="text" 
                className="input-gem flex-1 text-sm bg-[#0a0f1e]" 
                placeholder="Say something..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                maxLength={200}
              />
              <button 
                type="submit" 
                className="btn-gold p-2 shrink-0 aspect-square flex items-center justify-center"
                disabled={!chatInput.trim() || !isConnected}
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
