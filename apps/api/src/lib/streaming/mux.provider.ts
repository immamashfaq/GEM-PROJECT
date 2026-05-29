import { LiveStreamProvider, StreamSessionResult } from './types.js';

export class MuxStreamProvider implements LiveStreamProvider {
  name = 'mux';

  private tokenId = process.env.MUX_TOKEN_ID || '';
  private tokenSecret = process.env.MUX_TOKEN_SECRET || '';

  async createStream(title: string, description?: string): Promise<StreamSessionResult> {
    if (!this.tokenId || !this.tokenSecret) {
      throw new Error('Mux credentials MUX_TOKEN_ID and MUX_TOKEN_SECRET are not set');
    }

    const auth = Buffer.from(`${this.tokenId}:${this.tokenSecret}`).toString('base64');
    
    const response = await fetch('https://api.mux.com/video/v1/live-streams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        playback_policy: ['public'],
        new_asset_settings: {
          playback_policy: ['public'],
        },
        test: process.env.NODE_ENV !== 'production',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mux Stream Creation Failed: ${response.statusText} - ${errorText}`);
    }

    const json = await response.json() as any;
    const streamData = json.data;

    const playbackId = streamData.playback_ids?.[0]?.id;
    const playbackUrl = playbackId 
      ? `https://stream.mux.com/${playbackId}.m3u8`
      : '';

    return {
      streamKey: streamData.stream_key,
      rtmpUrl: 'rtmp://global-live.mux.com:5222/app',
      playbackUrl,
      providerReference: streamData.id,
    };
  }

  async getStreamStatus(providerReference: string): Promise<string> {
    if (!this.tokenId || !this.tokenSecret) {
      return 'idle';
    }

    const auth = Buffer.from(`${this.tokenId}:${this.tokenSecret}`).toString('base64');
    const response = await fetch(`https://api.mux.com/video/v1/live-streams/${providerReference}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      return 'unknown';
    }

    const json = await response.json() as any;
    return json.data?.status || 'idle';
  }

  async deleteStream(providerReference: string): Promise<void> {
    if (!this.tokenId || !this.tokenSecret) {
      return;
    }

    const auth = Buffer.from(`${this.tokenId}:${this.tokenSecret}`).toString('base64');
    await fetch(`https://api.mux.com/video/v1/live-streams/${providerReference}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });
  }
}
