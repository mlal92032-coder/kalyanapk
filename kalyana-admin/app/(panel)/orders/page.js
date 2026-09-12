"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const STATUS_COLORS = {
  pending: "bg-neutral-100 text-neutral-600",
  confirmed: "bg-blue-50 text-blue-700",
  processing: "bg-indigo-50 text-indigo-700",
  packed: "bg-purple-50 text-purple-700",
  shipped: "bg-cyan-50 text-cyan-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  refunded: "bg-orange-50 text-orange-700",
};

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="text-neutral-500">Loading…</div>}>
      <OrdersInner />
    </Suspense>
  );
}

function OrdersInner() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(searchParams.get("status") || "");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/orders${status ? `?status=${status}` : ""}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3">Order #</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Payment</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-neutral-400">Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-neutral-400">No orders found.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <Link href={`orders/${o.id}`} className="font-medium text-amber-800 hover:underline">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{o.customer_name}<div className="text-xs text-neutral-400">{o.customer_email}</div></td>
                  <td className="px-4 py-3">${o.total.toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize">{o.payment_status}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLORS[o.order_status]}`}>
                      {o.order_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

