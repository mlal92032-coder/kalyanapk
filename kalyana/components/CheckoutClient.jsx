"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CheckoutClient() {
  const router = useRouter();
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: "",
  });

  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((data) => {
        setCart(data);
        setLoading(false);
      });
  }, []);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not place order.");
        setSubmitting(false);
        return;
      }
      window.dispatchEvent(new Event("kalyana:cart-updated"));
      router.push(`/order-confirmation/${data.order.id}`);
    } catch {
      setError("Network error while placing order.");
      setSubmitting(false);
    }
  }

  const shippingFee = 15;
  const estimatedTotal = cart.subtotal + shippingFee;

  if (loading) {
    return <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">Loading…</main>;
  }

  if (cart.items.length === 0) {
    return (
      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full text-center">
        <p className="text-neutral-500 mb-4">Your cart is empty.</p>
        <Link href="/products" className="text-amber-800 font-medium hover:underline">
          Browse products →
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={submit} className="lg:col-span-2 space-y-4 bg-white border border-neutral-200 rounded-lg p-6">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              required
              value={form.customer_name}
              onChange={(e) => updateField("customer_name", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              required
              type="email"
              value={form.customer_email}
              onChange={(e) => updateField("customer_email", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              value={form.customer_phone}
              onChange={(e) => updateField("customer_phone", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Shipping Address</label>
            <textarea
              required
              rows={3}
              value={form.shipping_address}
              onChange={(e) => updateField("shipping_address", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-800 text-white font-semibold py-3 rounded-md hover:bg-amber-900 disabled:opacity-50"
          >
            {submitting ? "Placing Order…" : "Place Order"}
          </button>
        </form>

        <div className="border border-neutral-200 rounded-lg p-5 bg-white h-fit">
          <div className="text-sm font-semibold mb-3">Order Summary</div>
          <div className="space-y-2 mb-4">
            {cart.items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-neutral-600">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium">${item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-100 pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span>${cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Shipping</span>
              <span>${shippingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Estimated Total</span>
              <span>${estimatedTotal.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 mt-3">
            Final total is calculated and verified on the server when you place the order.
          </p>
        </div>
      </div>
    </main>
  );
}
