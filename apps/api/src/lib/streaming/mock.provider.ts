import { randomBytes } from 'crypto';
import { LiveStreamProvider, StreamSessionResult } from './types.js';

export class MockStreamProvider implements LiveStreamProvider {
  name = 'mock';

  async createStream(title: string, description?: string): Promise<StreamSessionResult> {
    const streamKey = `sk_live_${randomBytes(16).toString('hex')}`;
    const rtmpUrl = process.env.MOCK_RTMP_URL || 'rtmp://localhost:1935/stream';
    let playbackUrl = process.env.MOCK_PLAYBACK_URL || 'http://localhost:8080/live/{streamKey}.m3u8';
    playbackUrl = playbackUrl.replace('{streamKey}', streamKey);

    return {
      streamKey,
      rtmpUrl,
      playbackUrl,
      providerReference: `mock_ref_${randomBytes(8).toString('hex')}`,
    };
  }

  async getStreamStatus(providerReference: string): Promise<string> {
    return 'active';
  }

  async deleteStream(providerReference: string): Promise<void> {
    // No-op for mock provider
  }
}
