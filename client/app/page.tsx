import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-[#f7f6f3]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-stone-900 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-32">
          <span className="inline-block bg-emerald-900 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full mb-5 tracking-wide uppercase">
            Kenya's Seed Marketplace
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-5 text-white">
            Find Seeds &<br />
            <span className="text-emerald-400">Seedlings Near You</span>
          </h1>
          <p className="text-stone-400 text-lg mb-8 max-w-lg leading-relaxed">
            Connect with verified agro-dealers, nurseries, and farmer-producers across Kenya. Quality planting materials, one search away.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/products"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-xl transition">
              Browse Products →
            </Link>
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 border border-stone-600 hover:border-stone-400 text-stone-300 hover:text-white px-6 py-3 rounded-xl transition">
              Join as Seller
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-emerald-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap justify-center gap-8 text-sm font-medium">
          {[
            { label: 'Crop Varieties', value: '200+' },
            { label: 'Verified Sellers', value: '50+' },
            { label: 'Counties Covered', value: '10+' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-emerald-200 font-bold text-lg">{s.value}</span>
              <span className="text-emerald-100">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-2">Why SeedLocator</p>
        <h2 className="text-2xl font-bold text-stone-800 mb-10">Everything you need to source quality seeds</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: '🔍', title: 'Smart Search', desc: 'Find specific seeds and seedlings by name, category, or type — including rare indigenous varieties.' },
            { icon: '📍', title: 'Location-Based', desc: 'View seller locations on Google Maps and get directions to the nearest supplier in your area.' },
            { icon: '⭐', title: 'Ratings & Reviews', desc: 'Make informed decisions with community ratings and verified product reviews from fellow farmers.' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-stone-100 hover:border-emerald-200 hover:shadow-md transition group">
              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-emerald-100 transition">
                {f.icon}
              </div>
              <h3 className="font-semibold text-stone-800 mb-2">{f.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white border-y border-stone-100 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-2">Categories</p>
          <h2 className="text-2xl font-bold text-stone-800 mb-8">Browse by crop type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Food Crops', value: 'food-crop', emoji: '🌽', desc: 'Maize, beans, wheat & more' },
              { label: 'Horticultural', value: 'horticultural', emoji: '🥦', desc: 'Vegetables, fruits & flowers' },
              { label: 'Industrial', value: 'industrial', emoji: '🌿', desc: 'Tea, coffee, sugarcane' },
              { label: 'Indigenous', value: 'indigenous', emoji: '🌾', desc: 'Traditional & heritage seeds' },
            ].map(c => (
              <Link key={c.value} href={`/products?category=${c.value}`}
                className="group flex flex-col p-5 border border-stone-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50 transition">
                <span className="text-3xl mb-3">{c.emoji}</span>
                <span className="font-semibold text-stone-800 text-sm group-hover:text-emerald-700 transition">{c.label}</span>
                <span className="text-stone-400 text-xs mt-1">{c.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="bg-stone-900 rounded-3xl px-8 py-12 text-white">
          <h2 className="text-2xl font-bold mb-3">Are you a seller or agro-dealer?</h2>
          <p className="text-stone-400 mb-6 text-sm max-w-md mx-auto">
            List your seeds and seedlings on SeedLocator and reach thousands of farmers across Kenya.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-xl transition">
            Get Started Free →
          </Link>
        </div>
      </section>
    </div>
  );
}
