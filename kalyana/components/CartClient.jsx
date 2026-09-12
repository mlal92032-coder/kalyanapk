"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartClient() {
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

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
    <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

        {loading ? (
          <p className="text-neutral-500">Loading…</p>
        ) : cart.items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-500 mb-4">Your cart is empty.</p>
            <Link href="/products" className="text-amber-800 font-medium hover:underline">
              Browse products →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-3">
              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between border border-neutral-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex-1">
                    <Link href={`/products/${item.slug}`} className="font-medium hover:text-amber-800">
                      {item.name}
                    </Link>
                    <div className="text-sm text-neutral-500 mt-1">
                      ${item.unitPrice.toFixed(2)} / piece · MOQ {item.moq}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      defaultValue={item.quantity}
                      disabled={updating === item.productId}
                      onBlur={(e) => {
                        const qty = parseInt(e.target.value, 10) || 1;
                        if (qty !== item.quantity) updateQuantity(item.productId, qty);
                      }}
                      className="w-20 border border-neutral-300 rounded-md px-2 py-1 text-sm text-center"
                    />
                    <div className="w-24 text-right font-semibold">${item.lineTotal.toFixed(2)}</div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      disabled={updating === item.productId}
                      className="text-neutral-400 hover:text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-neutral-200 rounded-lg p-5 bg-white h-fit">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-semibold">${cart.subtotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-neutral-400 mb-4">
                Shipping and tax are calculated at checkout.
              </p>
              <Link
                href="/checkout"
                className="block text-center bg-amber-800 text-white font-semibold py-3 rounded-md hover:bg-amber-900"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
    </main>
  );
}
