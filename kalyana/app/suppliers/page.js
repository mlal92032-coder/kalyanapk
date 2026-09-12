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
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Suppliers</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((s) => (
            <Link
              key={s.id}
              href={`/suppliers/${s.slug}`}
              className="border border-neutral-200 rounded-lg p-5 bg-white hover:border-amber-700 hover:shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-800 font-bold">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{s.name}</div>
                  {!!s.verified && (
                    <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-neutral-500 line-clamp-2 mb-2">{s.description}</p>
              <div className="text-xs text-neutral-400">
                {s.location} · {s.product_count} product(s)
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
