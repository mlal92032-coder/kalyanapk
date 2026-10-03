"use client";

import { useEffect, useState } from "react";
import ReviewModeratorCard from "./ReviewModeratorCard";

export default function ReviewsManagementClient() {
  const [status, setStatus] = useState("pending");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reviews?status=${status}&page=${page}`);
        const data = await res.json();

        if (res.ok) {
          setReviews(data.reviews);
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
  }, [status, page]);

  const handleApprove = async (reviewId) => {
    setActionLoading(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to approve review");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reviewId, reason) => {
    if (!reason || reason.trim().length === 0) {
      alert("Please provide a rejection reason");
      return;
    }

    setActionLoading(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason }),
      });

      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reject review");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    setActionLoading(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete review");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const statusTabs = [
    { value: "pending", label: "Pending", count: "?" },
    { value: "approved", label: "Approved", count: "?" },
    { value: "rejected", label: "Rejected", count: "?" },
  ];

  return (
    <div className="space-y-6">
      {/* Status Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`px-4 py-3 font-medium transition-colors ${
              status === tab.value
                ? "border-b-2 border-emerald-500 text-emerald-600"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8 text-neutral-500">Loading reviews...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          No {status} reviews at the moment.
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewModeratorCard
                key={review.id}
                review={review}
                isLoading={actionLoading === review.id}
                onApprove={() => handleApprove(review.id)}
                onReject={(reason) => handleReject(review.id, reason)}
                onDelete={() => handleDelete(review.id)}
              />
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-neutral-600">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
