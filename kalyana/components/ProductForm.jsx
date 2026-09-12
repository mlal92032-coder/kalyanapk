"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = ["draft", "published", "hidden", "archived"];

function emptyTier() {
  return { min_qty: "", max_qty: "", price: "" };
}

export default function ProductForm({ productId }) {
  const router = useRouter();
  const isEdit = !!productId;

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    name: "", sku: "", category_id: "", supplier_id: "",
    description: "", short_description: "",
    base_price: "", currency: "USD", moq: 1, max_quantity: "",
    stock: 0, low_stock_threshold: 10, main_image: "", status: "draft",
  });
  const [tiers, setTiers] = useState([emptyTier()]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
    fetch("/api/admin/suppliers").then((r) => r.json()).then((d) => setSuppliers(d.suppliers || []));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    fetch(`/api/admin/products/${productId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.product) {
          setForm({
            ...data.product,
            category_id: data.product.category_id || "",
            supplier_id: data.product.supplier_id || "",
            max_quantity: data.product.max_quantity || "",
          });
        }
        if (data.bulk_pricing?.length) {
          setTiers(
            data.bulk_pricing.map((t) => ({
              min_qty: t.min_qty,
              max_qty: t.max_qty === null ? "" : t.max_qty,
              price: t.price,
            }))
          );
        }
        setLoading(false);
      });
  }, [isEdit, productId]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateTier(index, field, value) {
    setTiers((t) => t.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier)));
  }

  function addTier() {
    setTiers((t) => [...t, emptyTier()]);
  }

  function removeTier(index) {
    setTiers((t) => t.filter((_, i) => i !== index));
  }

  async function save(publish) {
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      base_price: Number(form.base_price),
      moq: Number(form.moq) || 1,
      max_quantity: form.max_quantity ? Number(form.max_quantity) : null,
      stock: Number(form.stock) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 10,
      category_id: form.category_id || null,
      supplier_id: form.supplier_id || null,
      status: publish ? "published" : form.status,
      bulk_pricing: tiers
        .filter((t) => t.min_qty !== "" && t.price !== "")
        .map((t) => ({
          min_qty: Number(t.min_qty),
          max_qty: t.max_qty === "" ? null : Number(t.max_qty),
          price: Number(t.price),
        })),
    };

    try {
      const res = await fetch(isEdit ? `/api/admin/products/${productId}` : "/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save product.");
        setSaving(false);
        return;
      }
      if (!isEdit) {
        router.push(`/admin/products/${data.product.id}`);
      } else {
        setMessage("Saved.");
        setForm((f) => ({ ...f, status: data.product.status }));
      }
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-neutral-500">Loading…</div>;

  return (
    <div className="max-w-3xl">
      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 mb-6">
        <h2 className="font-semibold text-lg mb-2">Product Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Name *</label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SKU</label>
            <input
              value={form.sku || ""}
              onChange={(e) => updateField("sku", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => updateField("category_id", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Supplier</label>
            <select
              value={form.supplier_id}
              onChange={(e) => updateField("supplier_id", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">— None —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Short Description</label>
          <input
            value={form.short_description || ""}
            onChange={(e) => updateField("short_description", e.target.value)}
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Full Description</label>
          <textarea
            rows={4}
            value={form.description || ""}
            onChange={(e) => updateField("description", e.target.value)}
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Main Image URL</label>
          <input
            value={form.main_image || ""}
            onChange={(e) => updateField("main_image", e.target.value)}
            placeholder="https://…"
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 mb-6">
        <h2 className="font-semibold text-lg mb-2">Pricing & Inventory</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Base Price *</label>
            <input
              type="number" step="0.01"
              value={form.base_price}
              onChange={(e) => updateField("base_price", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <input
              value={form.currency}
              onChange={(e) => updateField("currency", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">MOQ</label>
            <input
              type="number"
              value={form.moq}
              onChange={(e) => updateField("moq", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => updateField("stock", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Low Stock Threshold</label>
            <input
              type="number"
              value={form.low_stock_threshold}
              onChange={(e) => updateField("low_stock_threshold", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Quantity (optional)</label>
            <input
              type="number"
              value={form.max_quantity}
              onChange={(e) => updateField("max_quantity", e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-3 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg">Bulk Pricing Tiers</h2>
          <button onClick={addTier} type="button" className="text-sm text-emerald-700 hover:text-cyan-600 font-medium transition-colors">
            + Add Tier
          </button>
        </div>
        <p className="text-xs text-neutral-400 mb-2">
          Leave "Max Qty" blank on the last tier for an unbounded top range (e.g. 500+).
        </p>
        {tiers.map((tier, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              type="number" placeholder="Min qty"
              value={tier.min_qty}
              onChange={(e) => updateTier(i, "min_qty", e.target.value)}
              className="w-28 border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
            <span className="text-neutral-400">–</span>
            <input
              type="number" placeholder="Max qty (blank = +)"
              value={tier.max_qty}
              onChange={(e) => updateTier(i, "max_qty", e.target.value)}
              className="w-40 border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
            <span className="text-neutral-400">→</span>
            <input
              type="number" step="0.01" placeholder="Price"
              value={tier.price}
              onChange={(e) => updateTier(i, "price", e.target.value)}
              className="w-28 border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
            <button onClick={() => removeTier(i)} type="button" className="text-red-500 text-sm hover:underline">
              Remove
            </button>
          </div>
        ))}
      </div>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
      {message && <div className="text-sm text-emerald-700 mb-4">{message}</div>}

      <div className="flex items-center gap-3">
        <button
          onClick={() => save(false)}
          disabled={saving}
          className="border border-neutral-300 px-5 py-2.5 rounded-md text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
        >
          Save as Draft
        </button>
        <button
          onClick={() => save(true)}
          disabled={saving}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save & Publish"}
        </button>
        <span className="text-xs text-neutral-400 capitalize">Current status: {form.status}</span>
      </div>
    </div>
  );
}
