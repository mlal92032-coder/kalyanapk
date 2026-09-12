"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STATUS_COLORS = {
  draft: "bg-neutral-100 text-neutral-600",
  published: "bg-emerald-50 text-emerald-700",
  hidden: "bg-yellow-50 text-yellow-700",
  archived: "bg-red-50 text-red-700",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/products${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id, status) {
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function deleteProduct(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.archived) setMessage(data.message);
    else setMessage(`"${name}" was deleted.`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/products/new"
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/50 transition-all"
        >
          + Add Product
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="mb-4"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or SKU…"
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm w-72"
        />
      </form>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-md px-4 py-2 mb-4">
          {message}
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">SKU</th>
              <th className="text-left px-4 py-3">Price</th>
              <th className="text-left px-4 py-3">Stock</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-neutral-400">Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-neutral-400">No products found.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <Link href={`/products/${p.id}`} className="font-medium text-slate-900 hover:text-emerald-700 transition-colors">
                      {p.name}
                    </Link>
                    <div className="text-xs text-neutral-400">{p.category_name || "Uncategorized"}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{p.sku || "—"}</td>
                  <td className="px-4 py-3">{p.currency} {p.base_price.toFixed(2)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLORS[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {p.status !== "published" && (
                      <button onClick={() => setStatus(p.id, "published")} className="text-emerald-700 hover:underline text-xs">
                        Publish
                      </button>
                    )}
                    {p.status === "published" && (
                      <button onClick={() => setStatus(p.id, "hidden")} className="text-yellow-700 hover:underline text-xs">
                        Hide
                      </button>
                    )}
                    <Link href={`/products/${p.id}`} className="text-emerald-700 hover:text-cyan-600 font-medium text-xs transition-colors">
                      Edit
                    </Link>
                    <button onClick={() => deleteProduct(p.id, p.name)} className="text-red-600 hover:underline text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

