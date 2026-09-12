import Link from "next/link";

export default function ProductCard({ product }) {
  const tiers = product.bulk_pricing || [];
  const lowestTierPrice = tiers.length ? tiers[tiers.length - 1].price : null;

  const formatPKR = (amount) => {
    return `₨ ${parseFloat(amount).toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white border-2 border-emerald-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-cyan-400 hover:scale-105 transition-all duration-300"
    >
      <div className="aspect-square bg-gradient-to-br from-emerald-50 to-cyan-50 flex items-center justify-center text-neutral-300 text-4xl relative overflow-hidden">
        {product.main_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.main_image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
        ) : (
          <span>📦</span>
        )}
        {lowestTierPrice && lowestTierPrice < product.base_price && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-emerald-400 text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            💰 Bulk Save
          </div>
        )}
      </div>
      <div className="p-4 bg-gradient-to-b from-white to-emerald-50">
        {product.category_name && (
          <div className="text-xs uppercase tracking-widest text-emerald-600 font-bold mb-2">
            {product.category_name}
          </div>
        )}
        <div className="text-sm font-bold text-slate-900 line-clamp-2 mb-2 group-hover:text-emerald-700">
          {product.name}
        </div>
        <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold px-3 py-2 rounded-lg mb-2 text-center">
          {formatPKR(product.base_price)}
          <span className="text-xs font-normal block">per piece</span>
        </div>
        {lowestTierPrice && lowestTierPrice < product.base_price && (
          <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 px-3 py-2 rounded text-xs font-semibold mb-2">
            🎯 Bulk: {formatPKR(lowestTierPrice)}
          </div>
        )}
        <div className="text-xs text-slate-600 font-medium bg-slate-100 rounded px-2 py-1 inline-block">
          MOQ: {product.moq} pcs
        </div>
      </div>
    </Link>
  );
}
