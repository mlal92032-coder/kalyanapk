"use client";

import { useState } from "react";

export default function ReviewCard({ review, onLike }) {
  const [isLiking, setIsLiking] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    if (liked || isLiking) return;
    setIsLiking(true);
    try {
      await onLike(review.id);
      setLiked(true);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-yellow-200 transition-all duration-300 bg-white hover:bg-yellow-50/30">
      {/* Header with Stars */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`text-lg transition-all ${
                i < review.rating ? "text-yellow-400 drop-shadow-sm" : "text-neutral-300"
              }`}
            >
              ★
            </span>
          ))}
        </div>
        <div className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
          ✓ Verified Purchase
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-neutral-900 text-base mb-2 leading-tight">{review.title}</h3>

      {/* Reviewer Info */}
      <div className="flex gap-3 text-xs text-neutral-600 mb-4">
        <span className="font-semibold text-neutral-800">{review.customer_name}</span>
        <span className="text-neutral-400">•</span>
        <span>{new Date(review.created_at).toLocaleDateString("en-PK", {
          year: "numeric",
          month: "short",
          day: "numeric"
        })}</span>
      </div>

      {/* Content */}
      <p className="text-sm text-neutral-700 leading-relaxed mb-4 line-clamp-4">
        {review.content}
      </p>

      {/* Helpful Button */}
      <button
        onClick={handleLike}
        disabled={liked || isLiking}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
          liked
            ? "bg-emerald-100 text-emerald-700"
            : "bg-neutral-100 text-neutral-700 hover:bg-emerald-50 hover:text-emerald-600"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <span className="text-lg">{liked ? "👍" : "👍"}</span>
        <span>Helpful {review.helpful_count > 0 && `(${review.helpful_count})`}</span>
      </button>
    </div>
  );
}
