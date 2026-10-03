'use client';

import { useState, useEffect } from 'react';
import styles from './BannerManager.module.css';

export default function BannerManager() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [form, setForm] = useState({
    image_url: '',
    title: '',
    description: '',
    link_url: '',
    status: 'active',
    position: 0,
    start_date: '',
    end_date: '',
  });

  const [imageBase64, setImageBase64] = useState('');

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    try {
      setLoading(true);
      const res = await fetch('/api/banners');
      if (!res.ok) throw new Error('Failed to load banners');
      const data = await res.json();
      setBanners(data.banners || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageBase64(event.target.result);
      setForm(f => ({ ...f, image_url: event.target.result }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setActionLoading(true);

      const url = editingId ? `/api/banners/${editingId}` : '/api/banners';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(await res.json().then(d => d.error));

      setForm({
        image_url: '',
        title: '',
        description: '',
        link_url: '',
        status: 'active',
        position: 0,
        start_date: '',
        end_date: '',
      });
      setImageBase64('');
      setShowForm(false);
      setEditingId(null);
      await loadBanners();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this banner?')) return;
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete banner');
      await loadBanners();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEdit(banner) {
    setEditingId(banner.id);
    setForm({
      image_url: banner.image_url || '',
      title: banner.title || '',
      description: banner.description || '',
      link_url: banner.link_url || '',
      status: banner.status || 'active',
      position: banner.position || 0,
      start_date: banner.start_date || '',
      end_date: banner.end_date || '',
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm({
      image_url: '',
      title: '',
      description: '',
      link_url: '',
      status: 'active',
      position: 0,
      start_date: '',
      end_date: '',
    });
    setImageBase64('');
  }

  if (loading) return <div className={styles.container}><p>Loading banners...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Banner Management</h1>
        {!showForm && (
          <button className={styles.createBtn} onClick={() => setShowForm(true)}>
            + Create Banner
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {showForm && (
        <div className={styles.formContainer}>
          <h2>{editingId ? 'Edit Banner' : 'Create New Banner'}</h2>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Banner Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className={styles.fileInput}
                />
                {form.image_url && (
                  <div className={styles.imagePreview}>
                    <img src={form.image_url} alt="Banner preview" />
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Position (Order)</label>
                <input
                  type="number"
                  value={form.position || 0}
                  onChange={(e) => setForm(f => ({ ...f, position: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Banner Title</label>
              <input
                type="text"
                placeholder="e.g., Summer Sale"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                placeholder="Banner description or tagline"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Banner Link URL</label>
              <input
                type="url"
                placeholder="e.g., /products or https://example.com"
                value={form.link_url}
                onChange={(e) => setForm(f => ({ ...f, link_url: e.target.value }))}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Start Date</label>
                <input
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>End Date</label>
                <input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={form.status === 'active'}
                  onChange={(e) => setForm(f => ({ ...f, status: e.target.checked ? 'active' : 'inactive' }))}
                />
                Active
              </label>
            </div>

            <div className={styles.formActions}>
              <button type="submit" disabled={actionLoading} className={styles.submitBtn}>
                {actionLoading ? 'Saving...' : editingId ? 'Update Banner' : 'Create Banner'}
              </button>
              <button type="button" onClick={handleCancel} className={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners List */}
      <div className={styles.list}>
        {banners.length === 0 ? (
          <p className={styles.empty}>No banners yet. Create one to get started!</p>
        ) : (
          banners.map(banner => (
            <div key={banner.id} className={styles.card}>
              <div className={styles.imageContainer}>
                <img src={banner.image_url} alt={banner.title} />
                {banner.status !== 'active' && <div className={styles.inactive}>Inactive</div>}
              </div>

              <div className={styles.content}>
                <h3>{banner.title || 'Untitled Banner'}</h3>
                {banner.description && <p>{banner.description}</p>}
                {banner.link_url && <span className={styles.cta}>🔗 {banner.link_url}</span>}

                <div className={styles.meta}>
                  <span>Position: {banner.position}</span>
                  {banner.start_date && <span>From: {new Date(banner.start_date).toLocaleDateString()}</span>}
                  {banner.end_date && <span>To: {new Date(banner.end_date).toLocaleDateString()}</span>}
                </div>
              </div>

              <div className={styles.actions}>
                <button className={styles.editBtn} onClick={() => handleEdit(banner)}>
                  Edit
                </button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(banner.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
