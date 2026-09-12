import { notFound } from "next/navigation";
import getDb from "@/lib/db";
import { getBulkTiers } from "@/lib/pricing";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const db = getDb();

  const product = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
              s.name as supplier_name, s.slug as supplier_slug, s.verified as supplier_verified,
              s.location as supplier_location
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.slug = ? AND p.status = 'published'`
    )
    .get(slug);

  if (!product) notFound();

  const bulkPricing = getBulkTiers(product.id);
  const images = JSON.parse(product.images || "[]");

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-xs text-neutral-500 mb-6">
            <a href="/" className="hover:underline">Home</a>
            {product.category_name && (
              <>
                {" / "}
                <a href={`/category/${product.category_slug}`} className="hover:underline">
                  {product.category_name}
                </a>
              </>
            )}
            {" / "}
            <span className="text-neutral-700">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <div className="aspect-square bg-neutral-100 rounded-lg flex items-center justify-center text-6xl text-neutral-300 overflow-hidden">
                {product.main_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.main_image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span>📦</span>
                )}
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {images.map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={img} alt="" className="aspect-square object-cover rounded border border-neutral-200" />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">{product.name}</h1>
              {product.sku && <div className="text-xs text-neutral-400 mb-3">SKU: {product.sku}</div>}
              {product.short_description && (
                <p className="text-neutral-600 mb-4">{product.short_description}</p>
              )}

              {product.supplier_name && (
                <div className="text-sm text-neutral-600 mb-6">
                  Sold by{" "}
                  <a href={`/suppliers/${product.supplier_slug}`} className="text-emerald-700 font-medium hover:text-cyan-600 transition-colors">
                    {product.supplier_name}
                  </a>
                  {!!product.supplier_verified && (
                    <span className="ml-2 text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                  {product.supplier_location && (
                    <span className="text-neutral-400"> · {product.supplier_location}</span>
                  )}
                </div>
              )}

              <ProductPurchasePanel product={product} bulkPricing={bulkPricing} />
            </div>
          </div>

          {product.description && (
            <div className="mt-12 max-w-3xl">
              <h2 className="text-lg font-semibold mb-3">Product Description</h2>
              <p className="text-neutral-700 whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
