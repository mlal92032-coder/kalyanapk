import Link from "next/link";
import getDb from "@/lib/db";
import { getAllSettings } from "@/lib/settings";
import { getBulkTiers } from "@/lib/pricing";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";
import BannerCarousel from "@/components/BannerCarousel";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const db = getDb();
  const settings = getAllSettings();

  const categories = db
    .prepare(
      "SELECT * FROM categories WHERE status = 'published' AND parent_id IS NULL ORDER BY sort_order ASC LIMIT 6"
    )
    .all();

  const featured = db
    .prepare(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.status = 'published' ORDER BY p.created_at DESC LIMIT 8`
    )
    .all()
    .map((p) => ({ ...p, bulk_pricing: getBulkTiers(p.id) }));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero — Peacock Theme Premium Design */}
        <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-teal-900 to-emerald-950"></div>
          <div className="absolute inset-0 opacity-50">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-yellow-400 rounded-full filter blur-3xl opacity-10"></div>
          </div>

          <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="animate-fade-in mb-8">
              <div className="inline-block px-6 py-3 bg-emerald-500/20 border border-emerald-400/60 rounded-full text-sm text-emerald-200 font-semibold mb-8">
                ✨ Premium Peacock Collection
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-8 bg-gradient-to-r from-yellow-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                {settings.hero_heading}
              </h1>
              <p className="text-xl md:text-2xl text-cyan-50 leading-relaxed mb-12 max-w-3xl mx-auto">
                {settings.hero_subheading}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href={settings.hero_button_link || "/products"}
                className="group inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold rounded-full transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-110 text-lg border border-emerald-400/50"
              >
                {settings.hero_button_label || "Browse Products"}
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-10 py-5 border-2 border-cyan-400 text-cyan-200 font-bold rounded-full hover:bg-cyan-500/10 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/30 text-lg"
              >
                Learn More
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-emerald-400/30 hover:border-emerald-400/60 transition-all">
                <div className="text-4xl font-bold text-yellow-300 mb-2">100%</div>
                <div className="text-cyan-200 font-semibold">Premium Quality</div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-cyan-400/30 hover:border-cyan-400/60 transition-all">
                <div className="text-4xl font-bold text-cyan-300 mb-2">24/7</div>
                <div className="text-emerald-200 font-semibold">Dedicated Support</div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-yellow-400/30 hover:border-yellow-400/60 transition-all">
                <div className="text-4xl font-bold text-emerald-300 mb-2">10K+</div>
                <div className="text-teal-200 font-semibold">Satisfied Customers</div>
              </div>
            </div>
          </div>
        </section>

        {/* Promotional Banners */}
        <BannerCarousel />

        {/* Categories */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="mb-12">
            <h2 className="text-4xl font-bold mb-3 text-slate-900">Shop by Category</h2>
            <p className="text-slate-600 text-lg">Explore our curated collections</p>
          </div>
          {categories.length === 0 ? (
            <p className="text-neutral-500 text-sm">No categories published yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="border-2 border-emerald-300 rounded-2xl p-6 text-center hover:border-cyan-300 hover:shadow-2xl hover:shadow-emerald-500/30 hover:scale-110 bg-gradient-to-br from-emerald-50 to-cyan-50 transition-all"
                >
                  <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-300 to-cyan-300 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {c.name.charAt(0)}
                  </div>
                  <div className="text-sm font-bold text-emerald-900">{c.name}</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured products */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-3">Featured Products</h2>
              <p className="text-slate-600 text-lg">Handpicked selections from our premium collection</p>
            </div>
            <Link href="/products" className="mt-6 md:mt-0 inline-flex items-center px-6 py-3 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors group">
              View all products
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          {featured.length === 0 ? (
            <p className="text-neutral-500 text-sm">No products published yet. Add some from the Owner C-Panel.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* Why Kalyana */}
        <section className="bg-gradient-to-br from-slate-50 to-blue-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Why Kalyana?</h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">Experience the difference with our premium, secure, and transparent platform</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-emerald-300">
                <div className="w-14 h-14 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 text-2xl">✅</div>
                <h3 className="font-bold text-lg mb-2 text-slate-900">Verified Suppliers</h3>
                <p className="text-slate-600">Every supplier is thoroughly reviewed and verified for quality and reliability.</p>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-cyan-300">
                <div className="w-14 h-14 bg-cyan-100 rounded-lg flex items-center justify-center mb-4 text-2xl">📦</div>
                <h3 className="font-bold text-lg mb-2 text-slate-900">Bulk Pricing</h3>
                <p className="text-slate-600">Automatic price breaks the more you order. Greater savings at scale.</p>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-yellow-300">
                <div className="w-14 h-14 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 text-2xl">🔒</div>
                <h3 className="font-bold text-lg mb-2 text-slate-900">Secure Checkout</h3>
                <p className="text-slate-600">Every transaction is encrypted and verified server-side for maximum security.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
