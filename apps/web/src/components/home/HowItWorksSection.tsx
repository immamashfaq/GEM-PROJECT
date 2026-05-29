import { UserPlus, Search, Gavel, Package } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Create Account',
    description: 'Register for free. Sellers need to complete KYC verification before listing.',
    color: 'text-gold-400',
    borderColor: 'border-gold-500/30',
  },
  {
    step: '02',
    icon: Search,
    title: 'Discover Gems',
    description: 'Browse the marketplace, filter by type, carat, origin, and certification lab.',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  {
    step: '03',
    icon: Gavel,
    title: 'Buy or Bid',
    description: 'Purchase instantly, make an offer, or participate in timed and live auctions.',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
  },
  {
    step: '04',
    icon: Package,
    title: 'Secure Delivery',
    description: 'Track your order. Confirm delivery and rate your seller after receiving your gem.',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-16" aria-labelledby="how-it-works-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 id="how-it-works-title" className="text-2xl sm:text-3xl font-bold text-white mb-3">
            How It Works
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Get started in minutes. Buy or sell gemstones with confidence.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              {/* Connector line (hidden on last item) */}
              {index < steps.length - 1 && (
                <div
                  className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-full h-px border-t border-dashed border-[#1e2d4e] z-0"
                  aria-hidden="true"
                />
              )}

              <div className="relative z-10 text-center">
                {/* Step number */}
                <div className="inline-flex items-center justify-center mb-4">
                  <div
                    className={`w-16 h-16 rounded-2xl border-2 ${step.borderColor} bg-[#0e1628] flex items-center justify-center relative`}
                    aria-hidden="true"
                  >
                    <step.icon size={24} className={step.color} />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gold-500 text-navy-900 text-[10px] font-bold flex items-center justify-center">
                      {step.step}
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
