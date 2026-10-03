"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

function formatPKR(amount) {
  return `₨ ${parseFloat(amount).toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

export default function ProductPurchasePanel({ product, bulkPricing }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(product.moq || 1);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Variant selection state
  const [variants, setVariants] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(true);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedSizeId, setSelectedSizeId] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);

  const fetchQuote = useCallback(
    async (qty) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, quantity: qty }),
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

  // Load variants, colors, and sizes for the product
  useEffect(() => {
    async function loadVariants() {
      setLoadingVariants(true);
      try {
        const [colorsRes, sizesRes, variantsRes] = await Promise.all([
          fetch(`/api/products/${product.id}/colors`),
          fetch(`/api/products/${product.id}/sizes`),
          fetch(`/api/products/${product.id}/variants`),
        ]);

        if (colorsRes.ok) {
          const colorsData = await colorsRes.json();
          setColors(colorsData.colors || []);
        }
        if (sizesRes.ok) {
          const sizesData = await sizesRes.json();
          setSizes(sizesData.sizes || []);
        }
        if (variantsRes.ok) {
          const variantsData = await variantsRes.json();
          const variantsList = variantsData.variants || [];
          setVariants(variantsList);
          // Auto-select first variant if only one exists
          if (variantsList.length === 1) {
            setSelectedVariantId(variantsList[0].id);
            setSelectedColorId(variantsList[0].color_id);
            setSelectedSizeId(variantsList[0].size_id);
          }
        }
      } catch (err) {
        console.error("Failed to load variants:", err);
      } finally {
        setLoadingVariants(false);
      }
    }

    loadVariants();
  }, [product.id]);

  useEffect(() => {
    fetchQuote(quantity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleQuantityChange(value) {
    const qty = Math.max(1, parseInt(value, 10) || 1);
    setQuantity(qty);
    setAdded(false);
    fetchQuote(qty);
  }

  // Get available variants based on selected color/size
  function getAvailableVariants() {
    return variants.filter(v => {
      const colorMatch = selectedColorId === null || v.color_id === selectedColorId;
      const sizeMatch = selectedSizeId === null || v.size_id === selectedSizeId;
      return colorMatch && sizeMatch;
    });
  }

  // Find variant ID based on selected color/size
  function findVariantId(colorId, sizeId) {
    const variant = variants.find(v =>
      v.color_id === colorId && v.size_id === sizeId
    );
    return variant?.id || null;
  }

  function handleColorChange(colorId) {
    setSelectedColorId(colorId);
    const newVariantId = findVariantId(colorId, selectedSizeId);
    setSelectedVariantId(newVariantId);
  }

  function handleSizeChange(sizeId) {
    setSelectedSizeId(sizeId);
    const newVariantId = findVariantId(selectedColorId, sizeId);
    setSelectedVariantId(newVariantId);
  }

  async function addToCart() {
    setAdding(true);
    setError("");

    // Validate variant selection if variants exist
    if (variants.length > 0 && !selectedVariantId) {
      setError("Please select a variant (color/size).");
      setAdding(false);
      return;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          variantId: selectedVariantId || null
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

  return (
    <div className="border border-neutral-200 rounded-lg p-5 bg-white">
      {/* Variant Selection (if available) */}
      {!loadingVariants && (colors.length > 0 || sizes.length > 0) && (
        <div className="mb-5 space-y-4">
          <div className="text-sm font-semibold text-slate-900">🎨 Select Variant</div>

          {/* Color Selection */}
          {colors.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleColorChange(null)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedColorId === null
                      ? "bg-emerald-500 text-white"
                      : "border-2 border-neutral-200 text-slate-700 hover:border-emerald-300"
                  }`}
                >
                  Any Color
                </button>
                {colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleColorChange(color.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                      selectedColorId === color.id
                        ? "bg-emerald-500 text-white"
                        : "border-2 border-neutral-200 text-slate-700 hover:border-emerald-300"
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded border border-slate-300"
                      style={{ backgroundColor: color.color_hex || "#ccc" }}
                    />
                    {color.color_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {sizes.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Size</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSizeChange(null)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedSizeId === null
                      ? "bg-emerald-500 text-white"
                      : "border-2 border-neutral-200 text-slate-700 hover:border-emerald-300"
                  }`}
                >
                  Any Size
                </button>
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => handleSizeChange(size.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedSizeId === size.id
                        ? "bg-emerald-500 text-white"
                        : "border-2 border-neutral-200 text-slate-700 hover:border-emerald-300"
                    }`}
                  >
                    {size.size_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variant availability indicator */}
          {variants.length > 0 && selectedColorId !== null && selectedSizeId !== null && !selectedVariantId && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              This combination is not available. Please select different options.
            </div>
          )}
        </div>
      )}

      {bulkPricing.length > 0 && (
        <div className="mb-5">
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

      <label className="block text-sm font-medium mb-1">Quantity</label>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="w-32 border-2 border-emerald-300 rounded-md px-3 py-2 text-sm font-semibold focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
        />
        <span className="text-xs text-slate-500">MOQ: {product.moq} pcs</span>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 border-2 border-emerald-300 rounded-md p-4 mb-4">
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

      <button
        onClick={addToCart}
        disabled={adding || loading || !!error}
        className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50"
      >
        {adding ? "Adding…" : added ? "Added ✓ — Add More" : "Add to Cart"}
      </button>
      {added && (
        <button
          onClick={() => router.push("/cart")}
          className="w-full mt-2 border-2 border-emerald-400 text-emerald-700 font-semibold py-3 rounded-lg hover:bg-emerald-50 transition-all"
        >
          Go to Cart
        </button>
      )}
    </div>
  );
}
