"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function ProductPurchasePanel({ product, bulkPricing }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(product.moq || 1);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

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

  async function addToCart() {
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity }),
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
      {bulkPricing.length > 0 && (
        <div className="mb-5">
          <div className="text-sm font-semibold mb-2">Bulk Pricing</div>
          <table className="w-full text-sm border border-neutral-200 rounded overflow-hidden">
            <thead className="bg-neutral-50 text-neutral-500 text-xs">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Quantity (pcs)</th>
                <th className="text-right px-3 py-2 font-medium">Price / piece</th>
              </tr>
            </thead>
            <tbody>
              {bulkPricing.map((tier) => {
                const isActive =
                  quantity >= tier.min_qty && (tier.max_qty === null || quantity <= tier.max_qty);
                return (
                  <tr
                    key={tier.id}
                    className={`border-t border-neutral-100 ${isActive ? "bg-amber-50" : ""}`}
                  >
                    <td className="px-3 py-2">
                      {tier.min_qty}
                      {tier.max_qty ? `–${tier.max_qty}` : "+"}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
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
          className="w-32 border border-neutral-300 rounded-md px-3 py-2 text-sm"
        />
        <span className="text-xs text-neutral-400">MOQ: {product.moq} pcs</span>
      </div>

      <div className="bg-neutral-50 rounded-md p-4 mb-4">
        {loading ? (
          <div className="text-sm text-neutral-400">Calculating price…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : quote ? (
          <>
            <div className="text-sm text-neutral-500">
              {quote.quantity} pieces × {product.currency} {quote.unitPrice.toFixed(2)}
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              Total: {product.currency} {quote.total.toFixed(2)}
            </div>
          </>
        ) : null}
      </div>

      <button
        onClick={addToCart}
        disabled={adding || loading || !!error}
        className="w-full bg-amber-800 text-white font-semibold py-3 rounded-md hover:bg-amber-900 disabled:opacity-50"
      >
        {adding ? "Adding…" : added ? "Added ✓ — Add More" : "Add to Cart"}
      </button>
      {added && (
        <button
          onClick={() => router.push("/cart")}
          className="w-full mt-2 border border-amber-800 text-amber-800 font-semibold py-3 rounded-md hover:bg-amber-50"
        >
          Go to Cart
        </button>
      )}
    </div>
  );
}
