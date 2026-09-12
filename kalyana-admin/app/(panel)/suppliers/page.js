"use client";

import { useEffect, useState } from "react";

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", location: "", contact_email: "", contact_phone: "", description: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/suppliers");
    const data = await res.json();
    setSuppliers(data.suppliers || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addSupplier(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return;
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setForm({ name: "", location: "", contact_email: "", contact_phone: "", description: "" });
    load();
  }

  async function toggleVerified(s) {
    await fetch(`/api/suppliers/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: s.verified ? 0 : 1 }),
    });
    load();
  }

  async function toggleStatus(s) {
    await fetch(`/api/suppliers/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s.status === "active" ? "suspended" : "active" }),
    });
    load();
  }

  async function deleteSupplier(s) {
    if (!confirm(`Delete supplier "${s.name}"?`)) return;
    const res = await fetch(`/api/suppliers/${s.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.archived) setMessage(data.message);
    load();
  }

  return (
    <div className="flex-1 p-8 w-full overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Suppliers</h1>

      <form onSubmit={addSupplier} className="bg-white border border-neutral-200 rounded-lg p-5 mb-6 grid sm:grid-cols-2 gap-3">
        <input
          placeholder="Supplier name *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          placeholder="Contact email"
          value={form.contact_email}
          onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          placeholder="Contact phone"
          value={form.contact_phone}
          onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm sm:col-span-2"
          rows={2}
        />
        <button className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/50 transition-all sm:col-span-2 w-fit">
          Add Supplier
        </button>
        {error && <div className="text-sm text-red-600 sm:col-span-2">{error}</div>}
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
              <th className="text-left px-4 py-3">Location</th>
              <th className="text-left px-4 py-3">Products</th>
              <th className="text-left px-4 py-3">Verified</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-neutral-400">Loading…</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-neutral-400">No suppliers yet.</td></tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-neutral-500">{s.location || "—"}</td>
                  <td className="px-4 py-3">{s.product_count}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleVerified(s)}
                      className={`text-xs px-2 py-1 rounded-full ${s.verified ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}
                    >
                      {s.verified ? "✓ Verified" : "Not Verified"}
                    </button>
                  </td>
                  <td className="px-4 py-3 capitalize">{s.status}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => toggleStatus(s)} className="text-emerald-700 hover:text-cyan-600 font-medium text-xs transition-colors">
                      {s.status === "active" ? "Suspend" : "Activate"}
                    </button>
                    <button onClick={() => deleteSupplier(s)} className="text-red-600 hover:underline text-xs">
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

