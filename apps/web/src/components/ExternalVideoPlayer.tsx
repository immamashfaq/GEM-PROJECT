'use client';

import React from 'react';

export function ExternalVideoPlayer({ src }: { src: string }) {
  let embedUrl = '';

  if (src.includes('facebook.com')) {
    embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(src)}&show_text=0&autoplay=true`;
  } else if (src.includes('youtube.com') || src.includes('youtu.be')) {
    let videoId = '';
    if (src.includes('youtu.be/')) {
      videoId = src.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (src.includes('youtube.com/live/')) {
      videoId = src.split('youtube.com/live/')[1]?.split('?')[0] || '';
    } else {
      const urlParams = new URLSearchParams(src.split('?')[1] || '');
      videoId = urlParams.get('v') || '';
    }
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
  } else if (src.includes('twitch.tv')) {
    const channelName = src.split('twitch.tv/')[1]?.split('?')[0];
    if (channelName) {
      const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      embedUrl = `https://player.twitch.tv/?channel=${channelName}&parent=${parent}&autoplay=true`;
    }
  }

  if (!embedUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-gray-400 p-4">
        <p className="text-center font-semibold mb-2">External stream URL format not supported.</p>
        <p className="text-xs text-gray-600">Please provide a valid Facebook Live, YouTube, or Twitch URL.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <iframe
        src={embedUrl}
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        className="w-full h-full border-none"
      />
    </div>
  );
}
