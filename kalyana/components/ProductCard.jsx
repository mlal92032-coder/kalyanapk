import Link from "next/link";

export default function ProductCard({ product }) {
  const tiers = product.bulk_pricing || [];
  const lowestTierPrice = tiers.length ? tiers[tiers.length - 1].price : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md hover:border-amber-700 transition"
    >
      <div className="aspect-square bg-neutral-100 flex items-center justify-center text-neutral-300 text-4xl">
        {product.main_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.main_image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span>📦</span>
        )}
      </div>
      <div className="p-3">
        {product.category_name && (
          <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">
            {product.category_name}
          </div>
        )}
        <div className="text-sm font-medium text-neutral-900 line-clamp-2 mb-1 group-hover:text-amber-800">
          {product.name}
        </div>
        <div className="text-amber-800 font-semibold">
          {product.currency} {product.base_price.toFixed(2)}
          <span className="text-neutral-400 font-normal text-xs"> / piece</span>
        </div>
        {lowestTierPrice && lowestTierPrice < product.base_price && (
          <div className="text-[11px] text-neutral-500 mt-0.5">
            From {product.currency} {lowestTierPrice.toFixed(2)} in bulk
          </div>
        )}
        <div className="text-[11px] text-neutral-400 mt-1">MOQ: {product.moq} pcs</div>
      </div>
    </Link>
  );
}
