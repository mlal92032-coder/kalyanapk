'use client';

import { useState, useEffect } from 'react';
import styles from './VariantImages.module.css';

export default function VariantImages({ productId, variantId, colors }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [imageBase64, setImageBase64] = useState('');

  useEffect(() => {
    loadImages();
  }, [productId, variantId]);

  async function loadImages() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/products/${productId}/variants/${variantId}/images`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
      }
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
      setImageUrl('');
    };
    reader.readAsDataURL(file);
  }

  async function addImage(e) {
    e.preventDefault();
    if (!imageBase64 && !imageUrl) {
      setError('Please select an image or provide a URL');
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${productId}/variants/${variantId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageBase64 || imageUrl,
          color_id: selectedColor || null,
          is_primary: isPrimary,
        }),
      });

      if (!res.ok) throw new Error(await res.json().then(d => d.error));

      setImageBase64('');
      setImageUrl('');
      setSelectedColor('');
      setIsPrimary(false);
      await loadImages();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteImage(imageId) {
    if (!confirm('Delete this image?')) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants/${variantId}/images/${imageId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await res.json().then(d => d.error));
      await loadImages();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className={styles.container}>
      <h3>Variant Images</h3>
      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={addImage} className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Select Image</label>
            <input type="file" accept="image/*" onChange={handleImageSelect} />
          </div>
          <div className={styles.formGroup}>
            <label>Or Image URL</label>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={!!imageBase64}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Color (Optional)</label>
            <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
              <option value="">All Colors</option>
              {colors?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.color_name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.checkboxGroup}>
            <label>
              <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
              Set as primary image
            </label>
          </div>
        </div>

        <button type="submit" className={styles.submitBtn}>Upload Image</button>
      </form>

      {loading ? (
        <p>Loading images...</p>
      ) : images.length === 0 ? (
        <p className={styles.empty}>No images uploaded yet</p>
      ) : (
        <div className={styles.imageGrid}>
          {images.map((img) => (
            <div key={img.id} className={styles.imageItem}>
              <img src={img.image_url} alt="Variant" />
              <div className={styles.imageInfo}>
                {img.is_primary && <span className={styles.badge}>Primary</span>}
              </div>
              <button onClick={() => deleteImage(img.id)} className={styles.deleteBtn}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
