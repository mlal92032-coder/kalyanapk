"use client";

import { useEffect, useState } from "react";
import ReviewsSummary from "./ReviewsSummary";
import ReviewsList from "./ReviewsList";
import ReviewForm from "./ReviewForm";

export default function ProductReviewsClient({ productId }) {
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/reviews?productId=${productId}&limit=1`);
        const data = await res.json();
        if (res.ok) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Error fetching review stats:", err);
      }
    };

    fetchStats();

    const storedOrder = localStorage.getItem("kalyana_last_order");
    if (storedOrder) {
      try {
        setOrderInfo(JSON.parse(storedOrder));
      } catch (err) {
        console.error("Error parsing stored order:", err);
      }
    }
  }, [productId]);

  const handleFormSuccess = () => {
    setShowForm(false);
    window.location.reload();
  };

  return (
    <div className="w-full">
      {/* Professional Header */}
      <div className="mb-10">
        <h2 className="text-4xl font-black text-neutral-900 mb-2 tracking-tight">Ratings & Reviews</h2>
        <p className="text-base text-neutral-600">See what verified buyers think about this product</p>
      </div>

      {/* Main Content Grid */}
      <div className="space-y-12">
        {/* Reviews Summary Section */}
        {stats && (
          <section className="w-full">
            <ReviewsSummary stats={stats} />
          </section>
        )}

        {/* Reviews List Section */}
        {!showForm && (
          <section className="w-full">
            <div className="mb-8 pb-4 border-b-2 border-neutral-200">
              <h3 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full text-lg">💬</span>
                Customer Reviews
              </h3>
            </div>
            <ReviewsList productId={productId} />
          </section>
        )}

        {/* Write Review Section */}
        {!showForm && (
          <section className="w-full py-8 border-t-2 border-neutral-200">
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="text-center space-y-3">
                <h3 className="text-xl font-bold text-neutral-900">Share Your Experience</h3>
                <p className="text-neutral-600">Help other customers make informed decisions</p>
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="px-10 py-3.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 hover:from-yellow-500 hover:via-amber-500 hover:to-amber-600 text-white font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl text-base hover:scale-105 active:scale-95"
              >
                ⭐ Write a Review
              </button>

              {!orderInfo && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl px-6 py-4 max-w-xl text-center">
                  <p className="text-sm text-blue-800 font-semibold">
                    🔒 Complete a purchase to write a verified review
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Order info will be saved automatically when you checkout
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Review Form Section */}
        {showForm && (
          <section className="w-full space-y-6">
            <button
              onClick={() => setShowForm(false)}
              className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-bold text-sm py-2 px-4 rounded-lg hover:bg-neutral-100 transition-all"
            >
              <span className="text-lg">←</span>
              Back to Reviews
            </button>

            {orderInfo ? (
              <div>
                <div className="mb-8 pb-4 border-b-2 border-neutral-200">
                  <h3 className="text-2xl font-bold text-neutral-900">✍️ Write Your Review</h3>
                  <p className="text-sm text-neutral-600 mt-2">
                    Share your honest opinion • Help other buyers • Earn badges for helpful reviews
                  </p>
                </div>
                <ReviewForm
                  productId={productId}
                  orderId={orderInfo.orderId}
                  customerName={orderInfo.customerName}
                  customerEmail={orderInfo.customerEmail}
                  onSuccess={handleFormSuccess}
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 border-2 border-blue-300 rounded-2xl px-8 py-10 text-center shadow-lg">
                <div className="text-5xl mb-4">🔐</div>
                <h3 className="text-2xl font-bold text-blue-900 mb-3">Order Required</h3>
                <p className="text-base text-blue-700 leading-relaxed">
                  To maintain review quality, only verified buyers can write reviews. Complete your first purchase to unlock the review feature.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
