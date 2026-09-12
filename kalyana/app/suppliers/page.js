import Link from "next/link";
import getDb from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default function SuppliersPage() {
  const db = getDb();
  const suppliers = db
    .prepare(
      `SELECT s.*, (SELECT COUNT(*) FROM products WHERE supplier_id = s.id AND status = 'published') as product_count
       FROM suppliers s WHERE s.status = 'active' ORDER BY s.verified DESC, s.name ASC`
    )
    .all();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text mb-3">Our Verified Suppliers</h1>
          <p className="text-slate-600 text-lg">Trusted partners delivering quality products</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((s) => (
            <Link
              key={s.id}
              href={`/suppliers/${s.slug}`}
              className="group bg-white border-2 border-emerald-200 rounded-2xl p-6 hover:border-cyan-400 hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center text-emerald-800 font-bold text-lg shadow-md group-hover:shadow-lg transition-all">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 group-hover:text-emerald-700">{s.name}</div>
                  {!!s.verified && (
                    <span className="text-xs bg-gradient-to-r from-emerald-400 to-cyan-400 text-white px-3 py-1 rounded-full font-bold inline-block">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2 mb-4 group-hover:text-slate-700">{s.description}</p>
              <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 border border-emerald-200">
                📍 {s.location} · 📦 {s.product_count} product(s)
              </div>
            </Link>
          ))}
        </div>
        {suppliers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">No suppliers available yet.</p>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
