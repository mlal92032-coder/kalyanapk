'use client';

import { useState, useEffect } from 'react';
import styles from './ProductVariants.module.css';

export default function ProductVariants({ productId }) {
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('colors');

  // Color form state
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#000000');

  // Size form state
  const [sizeName, setSizeName] = useState('');

  // Variant form state
  const [variantColorId, setVariantColorId] = useState('');
  const [variantSizeId, setVariantSizeId] = useState('');
  const [variantSku, setVariantSku] = useState('');
  const [variantStock, setVariantStock] = useState('0');

  useEffect(() => {
    loadData();
  }, [productId]);

  async function loadData() {
    try {
      setLoading(true);
      const [colorsRes, sizesRes, variantsRes] = await Promise.all([
        fetch(`/api/admin/products/${productId}/colors`),
        fetch(`/api/admin/products/${productId}/sizes`),
        fetch(`/api/admin/products/${productId}/variants`),
      ]);

      if (colorsRes.ok) setColors(await colorsRes.json().then(d => d.colors || []));
      if (sizesRes.ok) setSizes(await sizesRes.json().then(d => d.sizes || []));
      if (variantsRes.ok) setVariants(await variantsRes.json().then(d => d.variants || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addColor(e) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/products/${productId}/colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color_name: colorName, color_hex: colorHex }),
      });

      if (!res.ok) throw new Error(await res.json().then(d => d.error));
      setColorName('');
      setColorHex('#000000');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteColor(colorId) {
    if (!confirm('Delete this color?')) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}/colors/${colorId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.json().then(d => d.error));
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addSize(e) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/products/${productId}/sizes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size_name: sizeName }),
      });

      if (!res.ok) throw new Error(await res.json().then(d => d.error));
      setSizeName('');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteSize(sizeId) {
    if (!confirm('Delete this size?')) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}/sizes/${sizeId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.json().then(d => d.error));
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addVariant(e) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color_id: variantColorId || null,
          size_id: variantSizeId || null,
          sku: variantSku || null,
          stock: parseInt(variantStock),
        }),
      });

      if (!res.ok) throw new Error(await res.json().then(d => d.error));
      setVariantColorId('');
      setVariantSizeId('');
      setVariantSku('');
      setVariantStock('0');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteVariant(variantId) {
    if (!confirm('Delete this variant?')) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.json().then(d => d.error));
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className={styles.container}>
      <h2>Product Variants</h2>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tabs}>
        <button className={activeTab === 'colors' ? styles.active : ''} onClick={() => setActiveTab('colors')}>
          Colors ({colors.length})
        </button>
        <button className={activeTab === 'sizes' ? styles.active : ''} onClick={() => setActiveTab('sizes')}>
          Sizes ({sizes.length})
        </button>
        <button className={activeTab === 'variants' ? styles.active : ''} onClick={() => setActiveTab('variants')}>
          Variants ({variants.length})
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : activeTab === 'colors' ? (
        <div className={styles.section}>
          <form onSubmit={addColor}>
            <input type="text" placeholder="Color name" value={colorName} onChange={(e) => setColorName(e.target.value)} required />
            <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} />
            <button type="submit">Add Color</button>
          </form>
          <div className={styles.list}>
            {colors.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No colors yet. Add one above!</p>
            ) : (
              colors.map((c) => (
                <div key={c.id} className={styles.item}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: c.color_hex || '#ccc',
                      border: '2px solid #ddd',
                      borderRadius: '4px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }} />
                    <div>
                      <strong>{c.color_name}</strong>
                      <div style={{ fontSize: '11px', color: '#999' }}>{c.color_hex}</div>
                    </div>
                  </div>
                  <button onClick={() => deleteColor(c.id)}>Delete</button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeTab === 'sizes' ? (
        <div className={styles.section}>
          <form onSubmit={addSize}>
            <input type="text" placeholder="Size name" value={sizeName} onChange={(e) => setSizeName(e.target.value)} required />
            <button type="submit">Add Size</button>
          </form>
          <div className={styles.list}>
            {sizes.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No sizes yet. Add one above!</p>
            ) : (
              sizes.map((s) => (
                <div key={s.id} className={styles.item}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#e5e7eb',
                      border: '2px solid #ddd',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#333'
                    }}>
                      {s.size_name.charAt(0).toUpperCase()}
                    </div>
                    <strong>{s.size_name}</strong>
                  </div>
                  <button onClick={() => deleteSize(s.id)}>Delete</button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className={styles.section}>
          <form onSubmit={addVariant}>
            <select value={variantColorId} onChange={(e) => setVariantColorId(e.target.value)}>
              <option value="">No Color</option>
              {colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.color_name}
                </option>
              ))}
            </select>
            <select value={variantSizeId} onChange={(e) => setVariantSizeId(e.target.value)}>
              <option value="">No Size</option>
              {sizes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.size_name}
                </option>
              ))}
            </select>
            <input type="text" placeholder="SKU (optional)" value={variantSku} onChange={(e) => setVariantSku(e.target.value)} />
            <input type="number" placeholder="Stock" value={variantStock} onChange={(e) => setVariantStock(e.target.value)} required />
            <button type="submit">Add Variant</button>
          </form>
          <div className={styles.list}>
            {variants.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No variants yet. Create one above by selecting color and size!</p>
            ) : (
              variants.map((v) => (
                <div key={v.id} className={styles.item}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    {v.color_hex && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: v.color_hex,
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {v.color_name || 'No Color'} {v.color_name && v.size_name ? '/' : ''} {v.size_name || 'No Size'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                        {v.sku && <>SKU: <strong>{v.sku}</strong> • </>}
                        Stock: <strong>{v.stock}</strong>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteVariant(v.id)}>Delete</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
