'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { useStreamChat } from '@/hooks/useStreamChat';
import { Radio, Copy, Check, Send, AlertTriangle, Play, LogOut, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ExternalVideoPlayer } from '@/components/ExternalVideoPlayer';

export default function SellerLivePage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);

  // Stream Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activeStream, setActiveStream] = useState<any>(null);
  const [streamSource, setStreamSource] = useState<'studio' | 'external'>('studio');
  const [externalUrl, setExternalUrl] = useState('');

  // Chat message state
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Clipboard copies
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Auto scroll chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auth checks
  useEffect(() => {
    if (isMounted && !isAuthLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/seller/live');
    }
  }, [isMounted, isAuthenticated, isAuthLoading, router]);

  // Fetch active streams to see if this seller is already streaming
  const { data: activeStreams, isLoading: isStreamsLoading } = useQuery({
    queryKey: ['active-streams'],
    queryFn: async () => {
      const res = await api.streams.getActive();
      return res.data.data;
    },
    enabled: !!user,
  });

  // Find if current user has an active stream
  useEffect(() => {
    if (activeStreams && user) {
      const myStream = activeStreams.find(
        (s: any) => s.sellerProfile?.user?.id === user.id
      );
      if (myStream) {
        // Retrieve key and RTMP from localStorage if created in this session, 
        // fallback to dummy or server response
        const cachedKey = localStorage.getItem(`stream_key_${myStream.id}`);
        const cachedUrl = localStorage.getItem(`stream_url_${myStream.id}`);
        setActiveStream({
          ...myStream,
          streamKey: cachedKey || myStream.streamKey || 'sk_hidden_in_list',
          rtmpUrl: cachedUrl || 'rtmp://live.gemmarketplace.local/app'
        });
      }
    }
  }, [activeStreams, user]);

  // Connect to live chat hook
  const streamId = activeStream?.id || '';
  const { messages, isConnected: isChatConnected, setMessages } = useStreamChat(streamId);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch older messages when stream starts
  useEffect(() => {
    if (streamId) {
      api.streams.getChatHistory(streamId).then((res) => {
        setMessages(res.data.data);
      }).catch((err) => {
        console.error('Failed to load chat history', err);
      });
    }
  }, [streamId, setMessages]);

  // Create stream mutation
  const createStreamMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; externalUrl?: string }) => {
      const res = await api.streams.create({
        title: data.title,
        description: data.description,
        externalUrl: data.externalUrl,
      });
      return res.data.data;
    },
    onSuccess: (stream) => {
      // Store credentials locally because they are sensitive/one-off
      if (stream.streamKey) {
        localStorage.setItem(`stream_key_${stream.id}`, stream.streamKey);
      }
      if (stream.rtmpUrl) {
        localStorage.setItem(`stream_url_${stream.id}`, stream.rtmpUrl);
      }
      
      setActiveStream(stream);
      queryClient.invalidateQueries({ queryKey: ['active-streams'] });
      toast.success('Live stream session initialized!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to start stream session');
    },
  });

  // End stream mutation
  const endStreamMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.streams.end(id);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      localStorage.removeItem(`stream_key_${variables}`);
      localStorage.removeItem(`stream_url_${variables}`);
      
      setActiveStream(null);
      setTitle('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['active-streams'] });
      toast.success('Broadcast session ended successfully.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to end stream session');
    },
  });

  const handleStartStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }
    if (streamSource === 'external' && !externalUrl.trim()) {
      toast.error('Please enter a valid external live video URL');
      return;
    }
    createStreamMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      externalUrl: streamSource === 'external' ? externalUrl.trim() : undefined,
    });
  };

  const handleEndStream = () => {
    if (!activeStream) return;
    if (confirm('Are you sure you want to end this live stream broadcast? This cannot be undone.')) {
      endStreamMutation.mutate(activeStream.id);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeStream) return;

    try {
      setIsSendingChat(true);
      await api.streams.sendChatMessage(activeStream.id, {
        message: chatInput.trim(),
      });
      setChatInput('');
    } catch (err: any) {
      toast.error('Failed to send message');
    } finally {
      setIsSendingChat(false);
    }
  };

  const copyToClipboard = (text: string, type: 'url' | 'key') => {
    const handleSuccess = () => {
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }
      toast.success('Copied to clipboard');
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(handleSuccess)
        .catch(() => fallbackCopy(text, handleSuccess));
    } else {
      fallbackCopy(text, handleSuccess);
    }
  };

  const fallbackCopy = (text: string, onSuccess: () => void) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        onSuccess();
      } else {
        toast.error('Failed to copy. Please copy manually.');
      }
    } catch (err) {
      toast.error('Failed to copy. Please copy manually.');
    }
  };

  if (!isMounted || isAuthLoading || isStreamsLoading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-[#080d1a]">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (!user) return null;

  // Verify roles
  const isSeller = user.role === 'SELLER' || user.role === 'VERIFIED_SELLER';
  const isVerifiedSeller = user.role === 'VERIFIED_SELLER';

  if (!isSeller) {
    return (
      <div className="pt-24 min-h-screen bg-[#080d1a] flex items-center justify-center px-4">
        <div className="card-gem p-8 text-center max-w-md w-full">
          <AlertTriangle className="text-red-400 mx-auto mb-4" size={48} />
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Only sellers can access the Live Streaming studio. Please register as a seller first.
          </p>
          <Link href="/seller/onboarding" className="btn-gold w-full justify-center">
            Register as Seller
          </Link>
        </div>
      </div>
    );
  }

  if (!isVerifiedSeller) {
    return (
      <div className="pt-24 min-h-screen bg-[#080d1a] flex items-center justify-center px-4">
        <div className="card-gem p-8 text-center max-w-md w-full">
          <AlertTriangle className="text-gold-500 mx-auto mb-4" size={48} />
          <h1 className="text-xl font-bold text-white mb-2">KYC Verification Required</h1>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            To prevent fraud and maintain listing integrity, only verified sellers with an approved KYC application can go live.
          </p>
          <Link href="/seller/dashboard" className="btn-gold w-full justify-center mb-3">
            Go to Seller Dashboard
          </Link>
          <Link href="/settings" className="text-sm text-gray-500 hover:text-white transition-colors">
            Check Verification Status
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-[#080d1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1e2d4e]">
          <div className="flex items-center gap-3">
            <Link href="/seller/dashboard" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gold-500 font-semibold uppercase tracking-wider">Seller Center</span>
              </div>
              <h1 className="text-2xl font-bold text-white mt-0.5">Stream Broadcast Studio</h1>
            </div>
          </div>

          {activeStream && (
            <button
              onClick={handleEndStream}
              disabled={endStreamMutation.isPending}
              className="btn-outline border-red-500/30 hover:bg-red-500/10 hover:border-red-500 text-red-400 text-sm gap-2"
            >
              {endStreamMutation.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <LogOut size={15} />
              )}
              End Broadcast
            </button>
          )}
        </div>

        {/* Content Toggle */}
        {!activeStream ? (
          /* STATE 1: SETUP BROADCAST */
          <div className="max-w-xl mx-auto mt-10">
            <div className="card-gem p-6">
              <div className="flex items-center gap-2 mb-6">
                <Radio className="text-gold-500 animate-pulse" size={20} />
                <h2 className="text-lg font-semibold text-white">Start New Live Stream</h2>
              </div>

              <form onSubmit={handleStartStream} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Stream Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Rare Ceylon Sapphire Showcase & Auction"
                    className="input-gem"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Title must be descriptive (min. 5 chars).</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Description (Optional)</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you are showcasing, bidding rules, or cert numbers..."
                    className="input-gem py-2.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Stream Source</label>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setStreamSource('studio')}
                      className={`p-3 rounded-lg border text-xs font-semibold transition-all text-center ${
                        streamSource === 'studio'
                          ? 'border-gold-500 bg-gold-500/10 text-white'
                          : 'border-[#1e2d4e] bg-[#0a0f1e]/40 text-gray-400 hover:border-gold-500/30'
                      }`}
                    >
                      OBS / Streamlabs Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => setStreamSource('external')}
                      className={`p-3 rounded-lg border text-xs font-semibold transition-all text-center ${
                        streamSource === 'external'
                          ? 'border-gold-500 bg-gold-500/10 text-white'
                          : 'border-[#1e2d4e] bg-[#0a0f1e]/40 text-gray-400 hover:border-gold-500/30'
                      }`}
                    >
                      External (Facebook, YT, Twitch)
                    </button>
                  </div>

                  {streamSource === 'external' && (
                    <div className="space-y-2 animate-fadeIn">
                      <label className="block text-xs font-medium text-gray-400">Live Video URL</label>
                      <input
                        type="url"
                        required
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        placeholder="e.g., https://www.facebook.com/watch/live/?v=..."
                        className="input-gem text-xs"
                      />
                      <p className="text-[10px] text-gray-500">
                        Paste the public share URL of your Facebook Live video, YouTube Live stream, or Twitch channel.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={createStreamMutation.isPending}
                  className="btn-gold w-full justify-center py-3 text-base"
                >
                  {createStreamMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Initializing...
                    </div>
                  ) : (
                    <>
                      <Play size={16} className="mr-2" />
                      Go Live Now
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* STATE 2: ACTIVE STREAM CONTROL ROOM */
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT 2 Columns: OBS details & Live Video Feed Info */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Live Info Banner */}
              <div className="card-gem p-6 border-l-4 border-red-500 bg-gradient-to-r from-red-500/5 to-transparent">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-red-400 font-bold text-sm tracking-widest">LIVE BROADCAST ACTIVE</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Started {new Date(activeStream.startedAt).toLocaleTimeString()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{activeStream.title}</h2>
                {activeStream.description && (
                  <p className="text-gray-400 text-sm mt-2 leading-relaxed">{activeStream.description}</p>
                )}
              </div>

              {/* Stream Feed / OBS Credentials */}
              {activeStream.playbackUrl && (
                activeStream.playbackUrl.includes('facebook.com') ||
                activeStream.playbackUrl.includes('youtube.com') ||
                activeStream.playbackUrl.includes('youtu.be') ||
                activeStream.playbackUrl.includes('twitch.tv')
              ) ? (
                /* External Feed Preview */
                <div className="card-gem p-6">
                  <h3 className="text-base font-semibold text-white mb-4">External Stream Linked</h3>
                  <div className="aspect-video w-full mb-4 border border-[#1e2d4e] rounded-lg overflow-hidden">
                    <ExternalVideoPlayer src={activeStream.playbackUrl} />
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Your stream is linked from <strong className="text-gold-400">{activeStream.playbackUrl}</strong>.
                    Viewers can watch the live broadcast directly on the <Link href={`/live/${activeStream.id}`} className="text-gold-400 underline hover:text-gold-300">Discovery Page</Link>.
                  </p>
                </div>
              ) : (
                /* Traditional OBS Credentials */
                <div className="card-gem p-6">
                  <h3 className="text-base font-semibold text-white mb-4">Streaming Credentials (OBS / Streamlabs)</h3>
                  <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                    Open your encoding software (e.g., OBS Studio), go to **Settings &gt; Stream**, select **Custom Service**, and enter the following settings:
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Server (RTMP URL)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={activeStream.rtmpUrl}
                          className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-lg px-3 py-2 text-xs text-gray-400 w-full focus:outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(activeStream.rtmpUrl, 'url')}
                          className="w-10 h-9 rounded-lg border border-[#1e2d4e] bg-[#0e1628] hover:border-gold-500/40 flex items-center justify-center shrink-0 transition-colors"
                        >
                          {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-400" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Stream Key</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          readOnly
                          value={activeStream.streamKey}
                          className="bg-[#0a0f1e] border border-[#1e2d4e] rounded-lg px-3 py-2 text-xs text-gray-400 w-full focus:outline-none tracking-widest"
                        />
                        <button
                          onClick={() => copyToClipboard(activeStream.streamKey, 'key')}
                          className="w-10 h-9 rounded-lg border border-[#1e2d4e] bg-[#0e1628] hover:border-gold-500/40 flex items-center justify-center shrink-0 transition-colors"
                        >
                          {copiedKey ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-400" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-navy-950/40 border border-[#1e2d4e] rounded-lg text-xs text-gray-400 leading-relaxed">
                    <strong className="text-gold-400">Important:</strong> Keep your stream key private. Anyone with access can hijack your live broadcast. Once you start sending feed from OBS, buyers will automatically see the live video on the <Link href={`/live/${activeStream.id}`} className="text-gold-400 underline hover:text-gold-300">Discovery Page</Link>.
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT Column: Live Chat Panel */}
            <div className="card-gem h-[550px] flex flex-col p-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2d4e] mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isChatConnected ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
                  Live Stream Chat
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20">
                  {isChatConnected ? 'Connected' : 'Reconnecting'}
                </span>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-[#1e2d4e] scrollbar-track-transparent">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-600 italic">
                    No chat messages yet. Welcome your viewers!
                  </div>
                ) : (
                  messages.map((msg: any) => (
                    <div key={msg.id} className="text-xs">
                      <span className="font-bold text-gold-400 mr-1.5">{msg.user?.username}:</span>
                      <span className="text-gray-300 break-words leading-relaxed">{msg.message}</span>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat form */}
              <form onSubmit={handleSendChat} className="mt-4 pt-3 border-t border-[#1e2d4e] flex gap-2">
                <input
                  type="text"
                  required
                  disabled={!isChatConnected}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isChatConnected ? "Type a message to viewers..." : "Chat disconnected..."}
                  className="input-gem py-2 text-xs"
                />
                <button
                  type="submit"
                  disabled={!isChatConnected || isSendingChat}
                  className="btn-gold px-3 py-2 shrink-0"
                  aria-label="Send message"
                >
                  <Send size={12} />
                </button>
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
