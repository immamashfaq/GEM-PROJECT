import { LiveStreamProvider } from './types.js';
import { MockStreamProvider } from './mock.provider.js';
import { MuxStreamProvider } from './mux.provider.js';

export class LiveStreamProviderRegistry {
  private static instance: LiveStreamProviderRegistry;
  private providers = new Map<string, LiveStreamProvider>();

  private constructor() {}

  static getInstance(): LiveStreamProviderRegistry {
    if (!LiveStreamProviderRegistry.instance) {
      LiveStreamProviderRegistry.instance = new LiveStreamProviderRegistry();
    }
    return LiveStreamProviderRegistry.instance;
  }

  register(provider: LiveStreamProvider) {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  get(name: string): LiveStreamProvider {
    const provider = this.providers.get(name.toLowerCase());
    if (!provider) {
      throw new Error(`Live stream provider '${name}' not found in registry`);
    }
    return provider;
  }
}

export const streamingRegistry = LiveStreamProviderRegistry.getInstance();
streamingRegistry.register(new MockStreamProvider());
streamingRegistry.register(new MuxStreamProvider());
