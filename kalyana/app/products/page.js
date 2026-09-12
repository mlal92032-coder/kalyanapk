import getDb from "@/lib/db";
import { getBulkTiers } from "@/lib/pricing";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }) {
  const { q, category } = await searchParams;
  const db = getDb();

  let sql = `
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published'
  `;
  const args = [];

  if (category) {
    sql += " AND c.slug = ?";
    args.push(category);
  }
  if (q) {
    sql += " AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)";
    const like = `%${q}%`;
    args.push(like, like, like);
  }
  sql += " ORDER BY p.created_at DESC";

  const products = db.prepare(sql).all(...args).map((p) => ({ ...p, bulk_pricing: getBulkTiers(p.id) }));

  return (
    <>
      <SiteHeader />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-2xl font-bold mb-1">
          {q ? `Search results for "${q}"` : category ? "Category Products" : "All Products"}
        </h1>
        <p className="text-sm text-neutral-500 mb-6">{products.length} product(s) found</p>

        {products.length === 0 ? (
          <p className="text-neutral-500">No products match your search.</p>
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
