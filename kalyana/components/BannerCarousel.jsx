'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './BannerCarousel.module.css';

export default function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBanners() {
      try {
        const res = await fetch('/api/banners?activeOnly=true');
        const data = await res.json();
        setBanners(data.banners || []);
      } catch (err) {
        console.error('Failed to load banners:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(timer);
  }, [banners.length]);

  if (loading) return null;
  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className={styles.carousel}>
      <div className={styles.container}>
        {/* Current Banner */}
        <div className={styles.slide}>
          <img src={currentBanner.image_url} alt={currentBanner.title} className={styles.image} />

          {/* Overlay Content */}
          <div className={styles.overlay}>
            <div className={styles.content}>
              {currentBanner.title && (
                <h2 className={styles.title}>{currentBanner.title}</h2>
              )}
              {currentBanner.description && (
                <p className={styles.description}>{currentBanner.description}</p>
              )}
              {currentBanner.button_text && currentBanner.button_url && (
                <Link href={currentBanner.button_url} className={styles.button}>
                  {currentBanner.button_text}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        {banners.length > 1 && (
          <>
            <button
              className={styles.navButton}
              onClick={handlePrevious}
              aria-label="Previous banner"
            >
              ‹
            </button>
            <button
              className={styles.navButton}
              onClick={handleNext}
              aria-label="Next banner"
            >
              ›
            </button>

            {/* Dots */}
            <div className={styles.dots}>
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
