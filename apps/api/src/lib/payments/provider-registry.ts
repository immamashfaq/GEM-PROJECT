import { PaymentProvider } from './types.js';
import { StripeMockProvider } from './stripe-mock.provider.js';

export class PaymentProviderRegistry {
  private static instance: PaymentProviderRegistry;
  private providers = new Map<string, PaymentProvider>();

  private constructor() {}

  static getInstance(): PaymentProviderRegistry {
    if (!PaymentProviderRegistry.instance) {
      PaymentProviderRegistry.instance = new PaymentProviderRegistry();
    }
    return PaymentProviderRegistry.instance;
  }

  register(provider: PaymentProvider) {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  get(name: string): PaymentProvider {
    const provider = this.providers.get(name.toLowerCase());
    if (!provider) {
      throw new Error(`Payment provider '${name}' not found in registry`);
    }
    return provider;
  }
}

export const paymentRegistry = PaymentProviderRegistry.getInstance();
paymentRegistry.register(new StripeMockProvider());
