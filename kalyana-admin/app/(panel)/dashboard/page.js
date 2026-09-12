"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <div className="text-slate-500 text-center py-8">Loading…</div>;

  const cards = [
    { label: "Published Products", value: stats.publishedProducts, sub: `${stats.totalProducts} total`, href: "/products", icon: "📦", color: "emerald" },
    { label: "Pending Orders", value: stats.pendingOrders, sub: `${stats.totalOrders} total orders`, href: "orders?status=pending", icon: "📋", color: "cyan" },
    { label: "Categories", value: stats.totalCategories, href: "categories", icon: "🗂️", color: "emerald" },
    { label: "Suppliers", value: stats.totalSuppliers, href: "suppliers", icon: "🏭", color: "yellow" },
    { label: "Revenue (paid)", value: `$${stats.revenue.toFixed(2)}`, href: "orders", icon: "💰", color: "cyan" },
    { label: "Low Stock Products", value: stats.lowStock.length, href: "/products", icon: "⚠️", color: "emerald" },
  ];

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text mb-2">Dashboard</h1>
          <p className="text-slate-600">Welcome back! Here's your business overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {cards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-xl transition-all hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`text-4xl group-hover:scale-110 transition-transform`}>{c.icon}</div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{c.value}</div>
              <div className="text-sm text-slate-600 font-medium">{c.label}</div>
              {c.sub && <div className="text-xs text-slate-500 mt-2">{c.sub}</div>}
            </Link>
          ))}
        </div>

        {/* Low Stock Alerts */}
        {stats.lowStock.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 font-bold text-yellow-800 mb-4">
              <span className="text-2xl">⚠️</span> Low Stock Alerts
            </div>
            <div className="space-y-3">
              {stats.lowStock.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="flex justify-between items-center p-3 bg-white rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-200"
                >
                  <span className="text-slate-900 font-medium">{p.name}</span>
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full font-semibold">
                    {p.stock} left (threshold {p.low_stock_threshold})
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 overflow-hidden">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No orders yet. Check back soon!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-50 to-cyan-50 border-b-2 border-emerald-200">
                  <tr>
                    <th className="text-left py-4 px-4 text-sm font-bold text-emerald-900">Order #</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-emerald-900">Customer</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-emerald-900">Status</th>
                    <th className="text-right py-4 px-4 text-sm font-bold text-emerald-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((o, idx) => (
                    <tr key={o.id} className={`border-b border-slate-100 hover:bg-emerald-50 transition-colors ${idx % 2 === 0 ? 'bg-slate-50/30' : ''}`}>
                      <td className="py-4 px-4">
                        <Link href={`orders/${o.id}`} className="text-emerald-600 hover:text-cyan-600 font-semibold transition-colors">
                          #{o.order_number}
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-slate-700">{o.customer_name}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          o.order_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          o.order_status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          o.order_status === 'shipped' ? 'bg-cyan-100 text-cyan-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {o.order_status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-slate-900 font-bold">${o.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

