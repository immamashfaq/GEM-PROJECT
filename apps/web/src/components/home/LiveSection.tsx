import Link from 'next/link';
import { Radio, ArrowRight, Users } from 'lucide-react';

export function LiveSection() {
  return (
    <section className="py-16" aria-labelledby="live-section-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-[#1e2d4e] bg-gradient-to-br from-[#0c1325] to-[#080d1a] p-8 lg:p-12">
          {/* Background glow */}
          <div
            className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            {/* Left content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
                <span className="text-sm font-semibold text-red-400">Live Auctions</span>
              </div>

              <h2 id="live-section-title" className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Watch & Bid in
                <span className="text-gradient-gold"> Real Time</span>
              </h2>

              <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                Join live streams by verified sellers. Watch them present gems, view certificates, and
                place bids in real time — all from your screen.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                {[
                  { icon: Radio, text: 'Live video streams' },
                  { icon: Users, text: 'Real-time bidding' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-gray-400">
                    <Icon size={16} className="text-gold-500" aria-hidden="true" />
                    {text}
                  </div>
                ))}
              </div>

              <Link href="/live" className="btn-gold inline-flex">
                <Radio size={16} aria-hidden="true" />
                Watch Live Streams
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            {/* Right — Mock stream preview card */}
            <div className="hidden lg:block">
              <div className="relative rounded-xl overflow-hidden border border-[#1e2d4e] aspect-video bg-[#080d1a]">
                {/* Mock stream interface */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="text-8xl opacity-10"
                    aria-hidden="true"
                  >
                    💎
                  </div>
                </div>

                {/* Live badge overlay */}
                <div className="absolute top-3 left-3">
                  <span className="badge-live" aria-label="Stream is live">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" aria-hidden="true" />
                    LIVE
                  </span>
                </div>

                {/* Viewer count */}
                <div
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs"
                  aria-label="412 viewers"
                >
                  <Users size={11} aria-hidden="true" />
                  412 watching
                </div>

                {/* Bottom bid info */}
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400">Current bid</div>
                      <div className="text-lg font-bold text-gold-400">LKR 165,000</div>
                    </div>
                    <button
                      className="btn-gold text-xs px-4 py-2"
                      aria-label="Place bid (example)"
                      type="button"
                    >
                      Place Bid
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
