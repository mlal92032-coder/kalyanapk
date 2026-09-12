import { notFound } from "next/navigation";
import getDb from "@/lib/db";
import { getBulkTiers } from "@/lib/pricing";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const db = getDb();

  const category = db
    .prepare("SELECT * FROM categories WHERE slug = ? AND status = 'published'")
    .get(slug);

  if (!category) notFound();

  const subcategories = db
    .prepare("SELECT * FROM categories WHERE parent_id = ? AND status = 'published'")
    .all(category.id);

  const products = db
    .prepare(
      `SELECT * FROM products WHERE status = 'published' AND
        (category_id = ? OR category_id IN (SELECT id FROM categories WHERE parent_id = ?))
       ORDER BY created_at DESC`
    )
    .all(category.id, category.id)
    .map((p) => ({ ...p, bulk_pricing: getBulkTiers(p.id) }));

  return (
    <>
      <SiteHeader />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-2xl font-bold mb-2">{category.name}</h1>

        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {subcategories.map((s) => (
              <Link
                key={s.id}
                href={`/category/${s.slug}`}
                className="text-sm border border-neutral-300 rounded-full px-3 py-1 hover:border-amber-700 hover:text-amber-800"
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}

        <p className="text-sm text-neutral-500 mb-6">{products.length} product(s)</p>

        {products.length === 0 ? (
          <p className="text-neutral-500">No products in this category yet.</p>
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
