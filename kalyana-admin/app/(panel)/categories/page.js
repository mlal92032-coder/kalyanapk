"use client";

import { useEffect, useState } from "react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState({ name: "", parent_id: "" });
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addCategory(e) {
    e.preventDefault();
    setError("");
    if (!newCat.name.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat.name, parent_id: newCat.parent_id || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setNewCat({ name: "", parent_id: "" });
    load();
  }

  async function toggleStatus(cat) {
    await fetch(`/api/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: cat.status === "published" ? "hidden" : "published" }),
    });
    load();
  }

  async function deleteCategory(cat) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setWarning(data.error);
      return;
    }
    setWarning("");
    load();
  }

  const topLevel = categories.filter((c) => !c.parent_id);

  return (
    <div className="flex-1 p-8 w-full overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      <form onSubmit={addCategory} className="bg-white border border-neutral-200 rounded-lg p-5 mb-6 flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-sm font-medium mb-1">New Category Name</label>
          <input
            value={newCat.name}
            onChange={(e) => setNewCat((c) => ({ ...c, name: e.target.value }))}
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm w-56"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Parent Category</label>
          <select
            value={newCat.parent_id}
            onChange={(e) => setNewCat((c) => ({ ...c, parent_id: e.target.value }))}
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">— Top Level —</option>
            {topLevel.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/50 transition-all">
          Add Category
        </button>
      </form>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
      {warning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-md px-4 py-2 mb-4">
          {warning}
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Parent</th>
              <th className="text-left px-4 py-3">Products</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-neutral-400">Loading…</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-neutral-400">No categories yet.</td></tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{c.parent_id ? `— ${c.name}` : c.name}</td>
                  <td className="px-4 py-3 text-neutral-500">{c.parent_name || "—"}</td>
                  <td className="px-4 py-3">{c.product_count}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${c.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => toggleStatus(c)} className="text-emerald-700 hover:text-cyan-600 font-medium text-xs transition-colors">
                      {c.status === "published" ? "Hide" : "Publish"}
                    </button>
                    <button onClick={() => deleteCategory(c)} className="text-red-600 hover:underline text-xs">
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

