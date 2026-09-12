import { notFound } from "next/navigation";
import getDb from "@/lib/db";
import { getBulkTiers } from "@/lib/pricing";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function SupplierDetailPage({ params }) {
  const { slug } = await params;
  const db = getDb();

  const supplier = db.prepare("SELECT * FROM suppliers WHERE slug = ? AND status = 'active'").get(slug);
  if (!supplier) notFound();

  const products = db
    .prepare("SELECT * FROM products WHERE supplier_id = ? AND status = 'published' ORDER BY created_at DESC")
    .all(supplier.id)
    .map((p) => ({ ...p, bulk_pricing: getBulkTiers(p.id) }));

  return (
    <>
      <SiteHeader />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="border border-neutral-200 rounded-lg p-6 bg-white mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-800 font-bold text-xl">
              {supplier.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{supplier.name}</h1>
              <div className="text-sm text-neutral-500">
                {supplier.location} {supplier.years_in_business ? `· ${supplier.years_in_business} yrs in business` : ""}
              </div>
            </div>
            {!!supplier.verified && (
              <span className="ml-auto text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                ✓ Verified Supplier
              </span>
            )}
          </div>
          {supplier.description && <p className="text-neutral-600 text-sm">{supplier.description}</p>}
          <div className="text-sm text-neutral-500 mt-3">
            {supplier.contact_email && <div>Email: {supplier.contact_email}</div>}
            {supplier.contact_phone && <div>Phone: {supplier.contact_phone}</div>}
          </div>
        </div>

        <h2 className="text-lg font-bold mb-4">Products from {supplier.name}</h2>
        {products.length === 0 ? (
          <p className="text-neutral-500">No published products yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
