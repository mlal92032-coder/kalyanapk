# Complete ProductVariantSelector Component Code

## File: `/kalyana/components/ProductVariantSelector.jsx`

```jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

function formatPKR(amount) {
  return `₨ ${parseFloat(amount).toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

export default function ProductVariantSelector({ product, variants, bulkPricing }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(product.moq || 1);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Extract unique colors and sizes from variants
  const uniqueColors = Array.from(
    new Map(
      variants
        .filter(v => v.color_hex)
        .map(v => [v.color_id, { id: v.color_id, name: v.color_name, hex: v.color_hex }])
    ).values()
  ).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const uniqueSizes = Array.from(
    new Map(
      variants
        .filter(v => v.size_name)
        .map(v => [v.size_id, { id: v.size_id, name: v.size_name }])
    ).values()
  ).sort((a, b) => {
    // Sort sizes with common pattern
    const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
    const aIndex = sizeOrder.indexOf((a.name || "").toUpperCase());
    const bIndex = sizeOrder.indexOf((b.name || "").toUpperCase());
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    return (a.name || "").localeCompare(b.name || "");
  });

  // Variant selection state
  const [selectedColor, setSelectedColor] = useState(uniqueColors.length > 0 ? uniqueColors[0].id : null);
  const [selectedSize, setSelectedSize] = useState(uniqueSizes.length > 0 ? uniqueSizes[0].id : null);

  // Find matching variant
  const selectedVariant = variants.find(v => v.color_id === selectedColor && v.size_id === selectedSize);
  const variantSKU = selectedVariant?.sku || product.sku;
  const variantStock = selectedVariant?.stock ?? product.stock;
  const variantPrice = selectedVariant?.price_override ?? product.base_price;

  const fetchQuote = useCallback(
    async (qty, variantId) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            quantity: qty,
            ...(variantId && { variantId }),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not calculate price.");
          setQuote(null);
        } else {
          setQuote(data);
        }
      } catch {
        setError("Network error while calculating price.");
      } finally {
        setLoading(false);
      }
    },
    [product.id]
  );

  useEffect(() => {
    fetchQuote(quantity, selectedVariant?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant?.id]);

  function handleQuantityChange(value) {
    const qty = Math.max(1, parseInt(value, 10) || 1);
    setQuantity(qty);
    setAdded(false);
    fetchQuote(qty, selectedVariant?.id);
  }

  function handleColorChange(colorId) {
    setSelectedColor(colorId);
    setAdded(false);
    // Reset size if selected color-size combo doesn't exist
    if (selectedSize) {
      const validVariant = variants.find(v => v.color_id === colorId && v.size_id === selectedSize);
      if (!validVariant && uniqueSizes.length > 0) {
        setSelectedSize(uniqueSizes[0].id);
      }
    }
  }

  function handleSizeChange(sizeId) {
    setSelectedSize(sizeId);
    setAdded(false);
    // Reset color if selected color-size combo doesn't exist
    if (selectedColor) {
      const validVariant = variants.find(v => v.color_id === selectedColor && v.size_id === sizeId);
      if (!validVariant && uniqueColors.length > 0) {
        setSelectedColor(uniqueColors[0].id);
      }
    }
  }

  async function addToCart() {
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          ...(selectedVariant?.id && { variantId: selectedVariant.id }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add to cart.");
      } else {
        setAdded(true);
        window.dispatchEvent(new Event("kalyana:cart-updated"));
      }
    } catch {
      setError("Network error while adding to cart.");
    } finally {
      setAdding(false);
    }
  }

  const isOutOfStock = variantStock <= 0;
  const displayPrice = variantPrice ?? product.base_price;

  return (
    <div className="space-y-6">
      {/* Color Swatches */}
      {uniqueColors.length > 0 && (
        <div className="border border-neutral-200 rounded-lg p-5 bg-white">
          <label className="block text-sm font-semibold text-neutral-900 mb-3">
            Color
          </label>
          <div className="flex gap-3 flex-wrap">
            {uniqueColors.map((color) => {
              const isSelected = selectedColor === color.id;
              const availableForColor = variants.some(
                v => v.color_id === color.id && (!selectedSize || v.size_id === selectedSize)
              );

              return (
                <button
                  key={color.id}
                  onClick={() => handleColorChange(color.id)}
                  disabled={!availableForColor}
                  className={`relative group transition-all duration-200 ${
                    !availableForColor ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  title={color.name}
                >
                  <div
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      isSelected
                        ? "border-neutral-900 shadow-lg shadow-neutral-900/30 scale-110"
                        : "border-neutral-300 hover:border-neutral-600"
                    }`}
                    style={{ backgroundColor: color.hex || "#CCCCCC" }}
                  />
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-neutral-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {color.name}
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg drop-shadow">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-neutral-500">
            Selected: {uniqueColors.find(c => c.id === selectedColor)?.name || "None"}
            {!availableForColor && <span className="text-red-600 ml-2">• Out of stock</span>}
          </div>
        </div>
      )}

      {/* Size Selector */}
      {uniqueSizes.length > 0 && (
        <div className="border border-neutral-200 rounded-lg p-5 bg-white">
          <label htmlFor="size-select" className="block text-sm font-semibold text-neutral-900 mb-3">
            Size
          </label>
          <select
            id="size-select"
            value={selectedSize || ""}
            onChange={(e) => handleSizeChange(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg text-sm font-medium focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all appearance-none bg-white cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: "36px",
            }}
          >
            <option value="">-- Select Size --</option>
            {uniqueSizes.map((size) => {
              const availableForSize = variants.some(
                v => v.size_id === size.id && (!selectedColor || v.color_id === selectedColor)
              );
              return (
                <option key={size.id} value={size.id} disabled={!availableForSize}>
                  {size.name} {!availableForSize ? "(Out of stock)" : ""}
                </option>
              );
            })}
          </select>
          {selectedSize && (
            <div className="mt-2 text-xs text-neutral-500">
              Selected size: <span className="font-semibold text-neutral-700">
                {uniqueSizes.find(s => s.id === selectedSize)?.name}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Variant Info Panel */}
      <div className="border-2 border-emerald-200 rounded-lg p-5 bg-emerald-50">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-neutral-600 font-medium">SKU</div>
            <div className="text-sm font-bold text-neutral-900">{variantSKU || "N/A"}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-600 font-medium">Stock Available</div>
            <div className={`text-sm font-bold ${isOutOfStock ? "text-red-600" : "text-emerald-700"}`}>
              {variantStock} pcs
            </div>
          </div>
        </div>
        <div className="text-xs text-emerald-700">
          {isOutOfStock && (
            <span className="font-semibold">⚠️ This variant is currently out of stock</span>
          )}
        </div>
      </div>

      {/* Bulk Pricing Table */}
      {bulkPricing.length > 0 && (
        <div className="border border-neutral-200 rounded-lg p-5 bg-white">
          <div className="text-sm font-semibold text-slate-900 mb-3">💰 Bulk Pricing Tiers</div>
          <table className="w-full text-sm border-2 border-emerald-300 rounded-lg overflow-hidden">
            <thead className="bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 text-xs font-bold">
              <tr>
                <th className="text-left px-4 py-3">Quantity (pcs)</th>
                <th className="text-right px-4 py-3">Price / piece</th>
              </tr>
            </thead>
            <tbody>
              {bulkPricing.map((tier) => {
                const isActive =
                  quantity >= tier.min_qty && (tier.max_qty === null || quantity <= tier.max_qty);
                return (
                  <tr
                    key={tier.id}
                    className={`border-t border-emerald-200 ${isActive ? "bg-emerald-50" : "bg-white hover:bg-cyan-50"} transition-colors`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {tier.min_qty}
                      {tier.max_qty ? `–${tier.max_qty}` : "+"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {product.currency} {tier.price.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Quantity & Purchase Panel */}
      <div className="border border-neutral-200 rounded-lg p-5 bg-white space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              disabled={isOutOfStock}
              className="w-32 border-2 border-emerald-300 rounded-md px-3 py-2 text-sm font-semibold focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 disabled:opacity-50 disabled:bg-neutral-100"
            />
            <span className="text-xs text-slate-500">MOQ: {product.moq} pcs</span>
          </div>
        </div>

        {/* Price Display */}
        <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 border-2 border-emerald-300 rounded-md p-4">
          {loading ? (
            <div className="text-sm text-slate-500 font-semibold">Calculating price…</div>
          ) : error ? (
            <div className="text-sm text-red-600 font-semibold">{error}</div>
          ) : quote ? (
            <>
              <div className="text-sm text-slate-700">
                {quote.quantity} pieces × {product.currency} {quote.unitPrice.toFixed(2)}
              </div>
              <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text">
                Total: {formatPKR(quote.total)}
              </div>
            </>
          ) : null}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={addToCart}
          disabled={adding || loading || !!error || isOutOfStock}
          className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOutOfStock
            ? "Out of Stock"
            : adding
            ? "Adding…"
            : added
            ? "Added ✓ — Add More"
            : "Add to Cart"}
        </button>

        {added && (
          <button
            onClick={() => router.push("/cart")}
            className="w-full border-2 border-emerald-400 text-emerald-700 font-semibold py-3 rounded-lg hover:bg-emerald-50 transition-all"
          >
            Go to Cart
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## Updated Page Component: `/kalyana/app/products/[slug]/page.js`

Key additions:

```jsx
import ProductVariantSelector from "@/components/ProductVariantSelector";

// In the component...

// Fetch all variants with their color and size details
const variants = db
  .prepare(
    `SELECT
       v.id, v.product_id, v.color_id, v.size_id, v.sku, v.stock, v.price_override,
       c.color_name, c.color_hex, s.size_name
     FROM product_variants v
     LEFT JOIN product_colors c ON v.color_id = c.id
     LEFT JOIN product_sizes s ON v.size_id = s.id
     WHERE v.product_id = ? AND v.status = 'active'
     ORDER BY c.color_name, s.size_name`
  )
  .all(product.id);

// In the JSX:
{variants.length > 0 ? (
  <ProductVariantSelector
    product={product}
    variants={variants}
    bulkPricing={bulkPricing}
  />
) : (
  <ProductPurchasePanel product={product} bulkPricing={bulkPricing} />
)}
```

---

## Key State Management

```javascript
// Selection state
const [selectedColor, setSelectedColor] = useState(uniqueColors[0]?.id || null);
const [selectedSize, setSelectedSize] = useState(uniqueSizes[0]?.id || null);

// Purchase state
const [quantity, setQuantity] = useState(product.moq || 1);
const [quote, setQuote] = useState(null);
const [loading, setLoading] = useState(false);
const [adding, setAdding] = useState(false);
const [added, setAdded] = useState(false);
const [error, setError] = useState("");

// Computed values
const selectedVariant = variants.find(v => 
  v.color_id === selectedColor && v.size_id === selectedSize
);
const isOutOfStock = selectedVariant?.stock <= 0;
```

---

## Event Handlers

```javascript
// Color selection with auto-reset logic
function handleColorChange(colorId) {
  setSelectedColor(colorId);
  setAdded(false);
  if (selectedSize) {
    const validVariant = variants.find(v => 
      v.color_id === colorId && v.size_id === selectedSize
    );
    if (!validVariant && uniqueSizes.length > 0) {
      setSelectedSize(uniqueSizes[0].id);
    }
  }
}

// Size selection with auto-reset logic
function handleSizeChange(sizeId) {
  setSelectedSize(sizeId);
  setAdded(false);
  if (selectedColor) {
    const validVariant = variants.find(v => 
      v.color_id === selectedColor && v.size_id === sizeId
    );
    if (!validVariant && uniqueColors.length > 0) {
      setSelectedColor(uniqueColors[0].id);
    }
  }
}

// Quantity change with quote fetch
function handleQuantityChange(value) {
  const qty = Math.max(1, parseInt(value, 10) || 1);
  setQuantity(qty);
  setAdded(false);
  fetchQuote(qty, selectedVariant?.id);
}

// Add to cart with variant support
async function addToCart() {
  setAdding(true);
  setError("");
  try {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        quantity,
        ...(selectedVariant?.id && { variantId: selectedVariant.id }),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not add to cart.");
    } else {
      setAdded(true);
      window.dispatchEvent(new Event("kalyana:cart-updated"));
    }
  } catch {
    setError("Network error while adding to cart.");
  } finally {
    setAdding(false);
  }
}
```

---

## Styling Highlights

### Color Swatches
- **Size**: `w-12 h-12` (48x48px)
- **Shape**: `rounded-full`
- **Border**: `border-2` with conditional classes
- **Selected**: `scale-110`, shadow, checkmark overlay
- **Hover**: Tooltip with color name

### Size Dropdown
- **Width**: `w-full`
- **Padding**: `px-4 py-3`
- **Border**: `border-2 border-neutral-300`
- **Focus**: `focus:border-cyan-500 focus:ring-2`
- **Custom Arrow**: SVG background image

### Variant Info Panel
- **Background**: `bg-emerald-50`
- **Border**: `border-2 border-emerald-200`
- **Grid**: 2-column layout with `grid-cols-2`
- **Text**: Emerald-700 for stock, red-600 for out of stock

### Pricing Display
- **Gradient**: `from-emerald-50 to-cyan-50`
- **Text Gradient**: `from-emerald-600 to-cyan-600 bg-clip-text`
- **Typography**: Large bold text for total

### Action Buttons
- **Primary**: `bg-gradient-to-r from-emerald-500 to-cyan-500`
- **Hover**: `hover:shadow-lg hover:shadow-emerald-500/50`
- **Secondary**: `border-2 border-emerald-400` with `hover:bg-emerald-50`
- **Disabled**: `disabled:opacity-50 disabled:cursor-not-allowed`

