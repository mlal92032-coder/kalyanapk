"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartClient() {
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const formatPKR = (amount) => {
    return `₨ ${parseFloat(amount).toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  async function load() {
    setLoading(true);
    const res = await fetch("/api/cart");
    const data = await res.json();
    setCart(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateQuantity(productId, quantity) {
    setUpdating(productId);
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: Math.max(1, quantity) }),
    });
    await load();
    window.dispatchEvent(new Event("kalyana:cart-updated"));
    setUpdating(null);
  }

  async function removeItem(productId) {
    setUpdating(productId);
    await fetch(`/api/cart?productId=${productId}`, { method: "DELETE" });
    await load();
    window.dispatchEvent(new Event("kalyana:cart-updated"));
    setUpdating(null);
  }

  return (
    <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text mb-2">🛒 Your Shopping Cart</h1>
        <p className="text-slate-600">Review your items before checkout</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-lg">⏳ Loading cart…</p>
        </div>
      ) : cart.items.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl border-2 border-emerald-200">
          <p className="text-slate-600 mb-6 text-lg font-semibold">🛍️ Your cart is empty</p>
          <Link href="/products" className="inline-block bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold px-8 py-3 rounded-xl hover:shadow-lg transition-all">
            Browse Products →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between border-2 border-emerald-200 rounded-2xl p-5 bg-white hover:border-cyan-300 hover:shadow-lg transition-all"
              >
                <div className="flex-1">
                  <Link href={`/products/${item.slug}`} className="font-bold text-slate-900 hover:text-emerald-700 block">
                    {item.name}
                  </Link>
                  <div className="text-sm text-slate-600 mt-2 bg-emerald-50 rounded-lg px-3 py-1 inline-block">
                    {formatPKR(item.unitPrice)} / piece · MOQ {item.moq}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <label className="text-xs text-slate-600 font-semibold block mb-1">Qty</label>
                    <input
                      type="number"
                      min={1}
                      defaultValue={item.quantity}
                      disabled={updating === item.productId}
                      onBlur={(e) => {
                        const qty = parseInt(e.target.value, 10) || 1;
                        if (qty !== item.quantity) updateQuantity(item.productId, qty);
                      }}
                      className="w-16 border-2 border-emerald-300 rounded-lg px-2 py-2 text-sm text-center font-bold focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600 font-semibold">Total</p>
                    <p className="text-lg font-bold text-emerald-700">{formatPKR(item.lineTotal)}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    disabled={updating === item.productId}
                    className="text-red-500 hover:text-red-700 font-bold text-lg hover:bg-red-50 rounded-lg px-3 py-2 transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 border-2 border-emerald-300 rounded-2xl p-6 h-fit shadow-lg">
            <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-slate-700 font-semibold pb-4 border-b-2 border-emerald-200">
                <span>Subtotal:</span>
                <span className="text-emerald-700">{formatPKR(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>🚚 Shipping:</span>
                <span className="text-emerald-600 font-semibold">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>📊 Tax:</span>
                <span className="text-emerald-600 font-semibold">Calculated at checkout</span>
              </div>
            </div>

            <div className="bg-white border-2 border-emerald-300 rounded-xl p-4 mb-6 text-center">
              <p className="text-sm text-slate-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text">
                {formatPKR(cart.subtotal)}
              </p>
            </div>

            <Link
              href="/checkout"
              className="block text-center bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold py-4 rounded-xl hover:shadow-2xl hover:shadow-emerald-500/50 transition-all mb-4"
            >
              🚀 Proceed to Checkout
            </Link>

            <Link
              href="/products"
              className="block text-center border-2 border-emerald-400 text-emerald-700 font-semibold py-3 rounded-xl hover:bg-emerald-50 transition-all"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
