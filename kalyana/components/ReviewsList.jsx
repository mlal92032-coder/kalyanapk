"use client";

import { useEffect, useState } from "react";
import ReviewCard from "./ReviewCard";

export default function ReviewsList({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reviews?productId=${productId}&page=${page}`);
        const data = await res.json();

        if (res.ok) {
          setReviews(data.reviews);
          setStats(data.stats);
          setPagination(data.pagination);
        } else {
          setError(data.error || "Failed to load reviews");
        }
      } catch (err) {
        setError("Network error while loading reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId, page]);

  const handleLike = async (reviewId) => {
    try {
      const sessionId = localStorage.getItem("kalyana_session_id") || `session_${Date.now()}`;
      localStorage.setItem("kalyana_session_id", sessionId);

      const res = await fetch(`/api/reviews/${reviewId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
          )
        );
      }
    } catch (err) {
      console.error("Error liking review:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="animate-spin text-4xl">⏳</div>
        <p className="text-neutral-600 font-medium">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <span className="text-2xl">⚠️</span>
        <p className="text-red-700 font-medium mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-neutral-600 font-medium">No reviews yet</p>
          <p className="text-sm text-neutral-500 mt-1">Be the first to share your experience</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} onLike={handleLike} />
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex flex-col items-center justify-center gap-4 py-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-6 py-2 border-2 border-neutral-300 rounded-lg text-sm font-bold hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-bold transition-all ${
                          page === pageNum
                            ? "bg-yellow-400 text-white shadow-lg"
                            : "border-2 border-neutral-300 hover:border-yellow-300 text-neutral-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {pagination.pages > 5 && (
                    <>
                      <span className="text-neutral-400">...</span>
                      <button
                        onClick={() => setPage(pagination.pages)}
                        className={`w-10 h-10 rounded-lg font-bold transition-all border-2 border-neutral-300 hover:border-yellow-300 text-neutral-700`}
                      >
                        {pagination.pages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-6 py-2 border-2 border-neutral-300 rounded-lg text-sm font-bold hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
              <p className="text-sm text-neutral-600 font-medium">
                Page <span className="font-bold text-yellow-600">{page}</span> of <span className="font-bold">{pagination.pages}</span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
