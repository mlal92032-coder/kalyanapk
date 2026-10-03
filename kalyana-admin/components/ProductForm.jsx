"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = ["draft", "published", "hidden", "archived"];

function emptyTier() {
  return { min_qty: "", max_qty: "", price: "" };
}

export default function ProductForm({ productId, onProductCreated }) {
  const router = useRouter();
  const isEdit = !!productId;

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    name: "", sku: "", category_id: "", supplier_id: "",
    description: "", short_description: "",
    base_price: "", currency: "PKR", moq: 1, max_quantity: "",
    stock: 0, low_stock_threshold: 10, main_image: "", status: "draft",
  });
  const [imagePreview, setImagePreview] = useState("");
  const [tiers, setTiers] = useState([emptyTier()]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        console.log("[Form] Loaded categories:", d.categories?.length || 0);
        setCategories(d.categories || []);
      })
      .catch((err) => {
        console.error("[Form] Failed to load categories:", err);
        setError("Could not load categories");
      });

    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((d) => {
        console.log("[Form] Loaded suppliers:", d.suppliers?.length || 0);
        setSuppliers(d.suppliers || []);
      })
      .catch((err) => {
        console.error("[Form] Failed to load suppliers:", err);
        setError("Could not load suppliers");
      });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    console.log("[Form] Loading product ID:", productId);

    fetch(`/api/products/${productId}`)
      .then((r) => {
        console.log("[Form] Fetch response status:", r.status);
        if (!r.ok) {
          throw new Error(`API returned ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        console.log("[Form] Fetched product data:", data);
        if (data.error) {
          console.error("[Form] API returned error:", data.error);
          setError(data.error);
          setLoading(false);
          return;
        }
        if (!data.product) {
          console.error("[Form] No product in response");
          setError("Product data is missing");
          setLoading(false);
          return;
        }
        console.log("[Form] Loaded product:", data.product.name);
        setForm({
          ...data.product,
          category_id: data.product.category_id || "",
          supplier_id: data.product.supplier_id || "",
          max_quantity: data.product.max_quantity || "",
        });

        if (data.bulk_pricing?.length) {
          console.log("[Form] Loaded bulk pricing tiers:", data.bulk_pricing.length);
          setTiers(
            data.bulk_pricing.map((t) => ({
              min_qty: t.min_qty,
              max_qty: t.max_qty === null ? "" : t.max_qty,
              price: t.price,
            }))
          );
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("[Form] Failed to load product:", err);
        setError(`Failed to load product: ${err.message}`);
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
      const url = isEdit ? `/api/products/${productId}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";
      console.log(`[Form] Sending ${method} request to ${url}`);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log(`[Form] Response status: ${res.status} (${res.ok ? 'OK' : 'ERROR'})`);
      const data = await res.json();
      console.log(`[Form] Response data:`, data);

      if (!res.ok) {
        const errorMsg = data.error || "Could not save product.";
        console.error(`[Form] API returned error: ${errorMsg}`);
        setError(errorMsg);
        setSaving(false);
        return;
      }

      if (!isEdit) {
        console.log(`[Form] Product created with ID: ${data.product?.id}`);
        console.log(`[Form] Product from API:`, data.product);
        if (!data.product || !data.product.id) {
          console.error("[Form] ERROR: Product ID is missing from response!");
          setError("Error: Product was created but couldn't get ID");
          setSaving(false);
          return;
        }

        // If callback provided, call it (for new product page with inline variants)
        if (onProductCreated) {
          onProductCreated(data.product.id);
          setMessage("✅ Product created! Now add colors, sizes, and variants below.");
        } else {
          // Otherwise navigate to edit page (for regular product creation)
          try {
            router.push(`/products/${data.product.id}`);
            console.log("[Form] Navigation successful");
          } catch (err) {
            console.error("[Form] Navigation failed:", err);
            setError(`Navigation error: ${err.message}`);
            setSaving(false);
          }
        }
      } else {
        console.log("[Form] Updated product successfully");
        setMessage("✅ Saved successfully!");
        setForm((f) => ({ ...f, status: data.product.status }));
      }
    } catch (err) {
      console.error("[Form] Network error:", err);
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-neutral-500">Loading…</div>;

  return (
    <div className="max-w-4xl">
      <div className="space-y-4">
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
          <label className="block text-sm font-bold mb-2 text-emerald-700">Product Image</label>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-2 text-slate-600">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = reader.result;
                      updateField("main_image", base64);
                      setImagePreview(base64);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full border-2 border-dashed border-emerald-300 rounded-lg px-3 py-4 text-sm text-slate-600 file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white"
              />
            </div>
            {(imagePreview || form.main_image) && (
              <div>
                <label className="block text-xs font-medium mb-2 text-slate-600">Preview</label>
                <img
                  src={imagePreview || form.main_image}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border-2 border-emerald-300"
                />
              </div>
            )}
          </div>
          <div className="mt-2">
            <label className="block text-xs font-medium mb-2 text-slate-600">Or Image URL</label>
            <input
              value={form.main_image || ""}
              onChange={(e) => updateField("main_image", e.target.value)}
              placeholder="https://…"
              className="w-full border border-cyan-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-cyan-300 rounded-xl p-6 space-y-4 mb-6 shadow-lg hover:shadow-xl transition-all">
        <h2 className="font-bold text-xl text-transparent bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text mb-4">💵 Pricing & Inventory</h2>
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

      <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 border-2 border-emerald-300 rounded-lg p-6 space-y-4 mb-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-emerald-900">💰 Bulk Pricing Tiers</h2>
          <button onClick={addTier} type="button" className="text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-semibold">
            + Add Tier
          </button>
        </div>
        <p className="text-xs text-slate-600 bg-white rounded-lg px-3 py-2 border border-emerald-200">
          💡 Leave "Max Qty" blank on the last tier for an unbounded top range (e.g. 500+).
        </p>
        {tiers.map((tier, i) => (
          <div key={i} className="bg-white border-2 border-emerald-200 rounded-lg p-4 hover:border-cyan-300 transition-all">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Min Qty</label>
                <input
                  type="number" placeholder="e.g. 10"
                  value={tier.min_qty}
                  onChange={(e) => updateTier(i, "min_qty", e.target.value)}
                  className="w-24 border-2 border-emerald-300 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                />
              </div>
              <span className="text-emerald-700 font-bold text-lg">–</span>
              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Max Qty</label>
                <input
                  type="number" placeholder="blank = +∞"
                  value={tier.max_qty}
                  onChange={(e) => updateTier(i, "max_qty", e.target.value)}
                  className="w-28 border-2 border-emerald-300 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                />
              </div>
              <span className="text-emerald-700 font-bold text-lg">→</span>
              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Price (₨)</label>
                <input
                  type="number" step="0.01" placeholder="Price"
                  value={tier.price}
                  onChange={(e) => updateTier(i, "price", e.target.value)}
                  className="w-28 border-2 border-emerald-300 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                />
              </div>
              <button onClick={() => removeTier(i)} type="button" className="text-red-500 text-sm font-bold hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-all mt-auto">
                🗑️ Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border-2 border-red-300 rounded-lg px-4 py-3 mb-4 font-semibold">❌ {error}</div>}
      {message && <div className="text-sm text-emerald-700 bg-emerald-50 border-2 border-emerald-300 rounded-lg px-4 py-3 mb-4 font-semibold">✅ {message}</div>}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => save(false)}
          disabled={saving}
          className="border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-lg text-sm font-bold hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 transition-all"
        >
          📝 Save as Draft
        </button>
        <button
          onClick={() => save(true)}
          disabled={saving}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-3 rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50 transition-all"
        >
          {saving ? "⏳ Saving…" : "🚀 Save & Publish"}
        </button>
        <span className="text-xs text-slate-600 capitalize font-semibold bg-slate-100 rounded-lg px-3 py-2 border border-slate-300">Status: <span className="text-emerald-700">{form.status}</span></span>
      </div>
    </div>
  );
}
