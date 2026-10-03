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
    payment_method: "cod",
    transaction_id: "",
    payment_screenshot_url: "",
  });
  const [screenshot, setScreenshot] = useState(null);

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

  function handleScreenshot(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setScreenshot(base64);
      setForm((f) => ({ ...f, payment_screenshot_url: base64 }));
    };
    reader.readAsDataURL(file);
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
        <Link href="/products" className="text-emerald-700 font-medium hover:text-cyan-600 transition-colors">
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

          <div className="pt-4 border-t border-neutral-200">
            <label className="block text-sm font-medium mb-3">Payment Method</label>
            <div className="space-y-2">
              {["cod", "easypaisa", "jazzcash", "bank"].map((method) => (
                <label key={method} className="flex items-center">
                  <input
                    type="radio"
                    name="payment_method"
                    value={method}
                    checked={form.payment_method === method}
                    onChange={(e) => updateField("payment_method", e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm capitalize">
                    {method === "cod" ? "Cash on Delivery" : method === "easypaisa" ? "Easypaisa" : method === "jazzcash" ? "JazzCash" : "Bank Transfer"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {form.payment_method !== "cod" && (
            <div className="space-y-3 p-3 bg-blue-50 rounded-md border border-blue-200">
              <div>
                <label className="block text-sm font-medium mb-1">Transaction ID</label>
                <input
                  required
                  value={form.transaction_id}
                  onChange={(e) => updateField("transaction_id", e.target.value)}
                  placeholder="Enter transaction ID or reference number"
                  className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshot}
                  required
                  className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                />
                {screenshot && (
                  <div className="mt-2 border border-neutral-200 rounded-md overflow-hidden max-w-xs">
                    <img src={screenshot} alt="Payment screenshot" className="w-full" />
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50"
          >
            {submitting ? "Placing Order…" : "Place Order"}
          </button>
        </form>

        <div className="border border-neutral-200 rounded-lg p-5 bg-white h-fit">
          <div className="text-sm font-semibold mb-3">Order Summary</div>
          <div className="space-y-2 mb-4">
            {cart.items.map((item) => {
              const itemKey = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
              return (
                <div key={itemKey} className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium">${item.lineTotal.toFixed(2)}</span>
                  </div>
                  {/* Display variant details if available */}
                  {(item.colorName || item.sizeName) && (
                    <div className="text-xs text-neutral-500 mt-1">
                      {item.colorName && <span>{item.colorName}</span>}
                      {item.colorName && item.sizeName && <span> • </span>}
                      {item.sizeName && <span>{item.sizeName}</span>}
                    </div>
                  )}
                </div>
              );
            })}
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
