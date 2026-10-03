"use client";

import { useState } from "react";

export default function ReviewModeratorCard({
  review,
  isLoading,
  onApprove,
  onReject,
  onDelete,
}) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    onReject(rejectReason);
    setRejectReason("");
    setShowRejectForm(false);
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-lg ${i < review.rating ? "text-yellow-400" : "text-neutral-300"}`}
              >
                ★
              </span>
            ))}
          </div>
          <h3 className="font-semibold text-neutral-900">{review.title}</h3>
          <div className="flex gap-2 text-xs text-neutral-500 mt-1">
            <span>{review.customer_name}</span>
            <span>•</span>
            <span>{review.customer_email}</span>
            <span>•</span>
            <span>{new Date(review.created_at).toLocaleDateString("en-PK")}</span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Product: <span className="font-medium text-neutral-600">{review.product_name}</span>
          </p>
        </div>

        <div className="text-xs font-medium px-2 py-1 rounded">
          {review.status === "pending" && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
          )}
          {review.status === "approved" && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Approved</span>
          )}
          {review.status === "rejected" && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Rejected</span>
          )}
        </div>
      </div>

      <p className="text-sm text-neutral-700 mb-4 bg-neutral-50 p-3 rounded line-clamp-4">
        {review.content}
      </p>

      {review.rejected_reason && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
          <p className="font-medium text-red-700">Rejection reason:</p>
          <p className="text-red-600">{review.rejected_reason}</p>
        </div>
      )}

      {review.status === "pending" ? (
        <>
          {!showRejectForm ? (
            <div className="flex gap-2">
              <button
                onClick={onApprove}
                disabled={isLoading}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-300 text-white font-medium py-2 rounded transition-colors text-sm"
              >
                {isLoading ? "Processing..." : "✓ Approve"}
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-neutral-300 text-white font-medium py-2 rounded transition-colors text-sm"
              >
                ✕ Reject
              </button>
              <button
                onClick={onDelete}
                disabled={isLoading}
                className="px-4 bg-neutral-300 hover:bg-neutral-400 disabled:bg-neutral-300 text-neutral-700 font-medium py-2 rounded transition-colors text-sm"
              >
                🗑️
              </button>
            </div>
          ) : (
            <form onSubmit={handleRejectSubmit} className="space-y-2">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection (visible to customer)..."
                maxLength={500}
                rows={2}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading || !rejectReason.trim()}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-neutral-300 text-white font-medium py-2 rounded transition-colors text-sm"
                >
                  {isLoading ? "Processing..." : "Confirm Rejection"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason("");
                  }}
                  className="px-4 bg-neutral-300 hover:bg-neutral-400 text-neutral-700 font-medium py-2 rounded transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <button
          onClick={onDelete}
          disabled={isLoading}
          className="w-full px-4 bg-neutral-300 hover:bg-neutral-400 disabled:bg-neutral-300 text-neutral-700 font-medium py-2 rounded transition-colors text-sm"
        >
          {isLoading ? "Processing..." : "Delete Review"}
        </button>
      )}
    </div>
  );
}
