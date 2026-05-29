import { Shield, BadgeCheck, Award, Headphones } from 'lucide-react';

const trustItems = [
  {
    icon: Shield,
    title: 'Buyer Protection',
    description:
      'Every purchase is covered by our buyer protection policy. Get a full refund if your gem doesn\'t match the description.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Sellers',
    description:
      'All sellers undergo KYC verification. Verified sellers have submitted government ID and proof of address.',
    color: 'text-gold-400',
    bg: 'bg-gold-500/10',
    border: 'border-gold-500/20',
  },
  {
    icon: Award,
    title: 'Certified Gems',
    description:
      'Filter by certification from GIA, AGL, Gübelin, NGJA, and other trusted laboratories worldwide.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    icon: Headphones,
    title: 'Dispute Support',
    description:
      'Our team mediates disputes between buyers and sellers. Every order has a 14-day dispute window.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
];

export function TrustSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-transparent to-[#060a14]/80" aria-labelledby="trust-section-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 id="trust-section-title" className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Your Trust is Our Priority
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Gem Project is built on transparency, verified identities, and buyer protection from day one.
          </p>
        </div>

        {/* Trust cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className={`card-gem p-6 border ${item.border}`}
              aria-label={item.title}
            >
              <div className={`w-11 h-11 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center mb-4`}>
                <item.icon size={20} className={item.color} aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 rounded-2xl border border-[#1e2d4e] bg-[#0e1628]/50">
          {[
            { value: '2,400+', label: 'Gems Listed' },
            { value: '180+', label: 'Verified Sellers' },
            { value: '98%', label: 'Buyer Satisfaction' },
            { value: 'LKR 50M+', label: 'Total Sales' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gradient-gold mb-1">
                {value}
              </div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
