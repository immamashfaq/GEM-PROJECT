export interface StreamSessionResult {
  streamKey: string;
  rtmpUrl: string;
  playbackUrl: string;
  providerReference: string;
}

export interface LiveStreamProvider {
  name: string;
  createStream(title: string, description?: string): Promise<StreamSessionResult>;
  getStreamStatus(providerReference: string): Promise<string>;
  deleteStream(providerReference: string): Promise<void>;
}
