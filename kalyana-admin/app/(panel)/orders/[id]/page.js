"use client";

import { useEffect, useState } from "react";

const ORDER_STATUSES = ["pending", "confirmed", "processing", "packed", "shipped", "delivered", "cancelled", "refunded"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

export default function AdminOrderDetailPage({ params }) {
  const [id, setId] = useState(null);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  async function load(orderId) {
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();
    setOrder(data.order);
    setItems(data.items || []);
  }

  useEffect(() => {
    if (id) load(id);
  }, [id]);

  async function updateStatus(field, value) {
    setSaving(true);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    const data = await res.json();
    setOrder(data.order);
    setSaving(false);
  }

  if (!order) return <div className="text-neutral-500">Loading…</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Order {order.order_number}</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Placed {new Date(order.created_at).toLocaleString()}
      </p>

      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <div className="font-semibold mb-3">Customer</div>
          <div className="text-sm space-y-1">
            <div>{order.customer_name}</div>
            <div className="text-neutral-500">{order.customer_email}</div>
            <div className="text-neutral-500">{order.customer_phone}</div>
            <div className="text-neutral-500">{order.shipping_address}</div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Order Status</label>
            <select
              disabled={saving}
              value={order.order_status}
              onChange={(e) => updateStatus("order_status", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm capitalize"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Status</label>
            <select
              disabled={saving}
              value={order.payment_status}
              onChange={(e) => updateStatus("payment_status", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm capitalize"
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-5">
        <div className="font-semibold mb-3">Items</div>
        <table className="w-full text-sm mb-4">
          <thead className="text-neutral-500 text-xs">
            <tr>
              <th className="text-left py-2">Product</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Unit Price</th>
              <th className="text-right py-2">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-neutral-100">
                <td className="py-2">{it.product_name}</td>
                <td className="py-2 text-right">{it.quantity}</td>
                <td className="py-2 text-right">${it.unit_price.toFixed(2)}</td>
                <td className="py-2 text-right">${it.line_total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-neutral-100 pt-3 space-y-1 text-sm max-w-xs ml-auto">
          <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span>${order.shipping_fee.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Tax</span><span>${order.tax.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Discount</span><span>-${order.discount.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}
