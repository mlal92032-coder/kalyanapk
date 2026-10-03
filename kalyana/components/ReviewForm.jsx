"use client";

import { useState } from "react";

export default function ReviewForm({ productId, orderId, customerName, customerEmail, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          orderId,
          customerName,
          customerEmail,
          rating: parseInt(rating),
          title,
          content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit review");
      } else {
        setSuccess(true);
        setTitle("");
        setContent("");
        setRating(5);
        onSuccess?.();
      }
    } catch (err) {
      setError("Network error while submitting review");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 border-2 border-emerald-300 rounded-2xl p-8 text-center shadow-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full mb-4 shadow-lg">
          <span className="text-4xl">✓</span>
        </div>
        <h3 className="font-bold text-emerald-900 mb-2 text-lg">Review submitted successfully!</h3>
        <p className="text-sm text-emerald-700">
          Thank you for your feedback. Your review will appear after admin approval.
        </p>
      </div>
    );
  }

  const contentPercent = Math.round((content.length / 1000) * 100);

  return (
    <form onSubmit={handleSubmit} className="border-2 border-neutral-200 rounded-2xl p-8 bg-gradient-to-br from-white to-neutral-50 shadow-lg">
      <h3 className="font-bold text-neutral-900 mb-6 text-lg">✍️ Share Your Experience</h3>

      {/* Rating Selection */}
      <div className="mb-8">
        <label className="block text-sm font-bold text-neutral-800 mb-4 uppercase tracking-wide">Rate this product</label>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="text-5xl transition-all duration-200 hover:scale-125 active:scale-100"
            >
              <span
                className={`drop-shadow-md ${
                  (hoverRating || rating) >= star
                    ? "text-yellow-400"
                    : "text-neutral-300"
                }`}
              >
                ★
              </span>
            </button>
          ))}
        </div>
        <p className="text-sm text-neutral-600 mt-3 font-medium">
          {["Poor", "Fair", "Good", "Very Good", "Excellent"][rating - 1]}
        </p>
      </div>

      {/* Title */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-neutral-800 mb-2 uppercase tracking-wide">Review title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience in one line"
          required
          maxLength={100}
          className="w-full px-4 py-3 border-2 border-neutral-300 rounded-xl text-sm font-medium focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all placeholder:text-neutral-400"
        />
        <p className="text-xs text-neutral-500 mt-1">{title.length}/100</p>
      </div>

      {/* Content */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-neutral-800 mb-2 uppercase tracking-wide">Detailed review</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tell others what you think about this product. What did you like or dislike? Would you recommend it?"
          required
          maxLength={1000}
          rows={5}
          className="w-full px-4 py-3 border-2 border-neutral-300 rounded-xl text-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all resize-none placeholder:text-neutral-400 font-medium"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-neutral-500">{content.length}/1000 characters</p>
          <div className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 transition-all duration-300"
              style={{ width: `${contentPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700 font-medium flex gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !title.trim() || !content.trim()}
        className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-neutral-300 disabled:to-neutral-400 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none disabled:cursor-not-allowed text-base"
      >
        {loading ? "⏳ Submitting your review..." : "✓ Submit Review"}
      </button>

      <p className="text-xs text-neutral-500 text-center mt-4">
        Your review will be published after admin verification
      </p>
    </form>
  );
}
