"use client";

export default function ReviewsSummary({ stats }) {
  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="bg-gradient-to-br from-neutral-50 via-gray-50 to-neutral-100 rounded-2xl p-12 text-center border-2 border-neutral-200 shadow-sm">
        <div className="text-7xl mb-4">⭐</div>
        <p className="text-xl font-bold text-neutral-800">No reviews yet</p>
        <p className="text-base text-neutral-600 mt-2">Be the first customer to share your experience</p>
      </div>
    );
  }

  const { averageRating, totalReviews, distribution } = stats;
  const maxCount = Math.max(...Object.values(distribution));

  const RatingBar = ({ rating, count }) => {
    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
    return (
      <div className="flex items-center gap-4 group py-3 px-3 rounded-lg hover:bg-yellow-50/60 transition-all duration-300">
        <div className="flex gap-0.5 w-24 flex-shrink-0">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`text-lg transition-all duration-200 ${
                i < rating ? "text-yellow-400 drop-shadow-sm" : "text-neutral-300"
              }`}
            >
              ★
            </span>
          ))}
        </div>

        <div className="flex-1 h-3 bg-neutral-200 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 rounded-full transition-all duration-700 shadow-md"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <span className="text-sm font-bold text-neutral-800 w-10 text-right tabular-nums">{count}</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white border-2 border-neutral-200 rounded-2xl p-10 shadow-xl">
      {/* Left: Main Rating */}
      <div className="flex flex-col items-center justify-center space-y-6 lg:border-r-2 lg:border-neutral-200 lg:pr-8">
        {/* Big Rating Circle */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-amber-200 rounded-full blur-3xl opacity-50 animate-pulse"></div>

          <div className="relative w-48 h-48 bg-gradient-to-br from-yellow-400 via-amber-400 to-amber-500 rounded-full shadow-2xl border-4 border-yellow-300 flex flex-col items-center justify-center">
            <div className="text-8xl font-black text-white drop-shadow-lg">{averageRating.toFixed(1)}</div>
            <div className="text-xs font-bold text-yellow-100 mt-1.5">out of 5</div>
          </div>
        </div>

        {/* Stars */}
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`text-3xl transition-all duration-300 ${
                i < Math.round(averageRating) ? "text-yellow-400 drop-shadow-lg" : "text-neutral-300"
              }`}
            >
              ★
            </span>
          ))}
        </div>

        {/* Review Count */}
        <div className="text-center space-y-2 pt-2">
          <p className="text-4xl font-black text-neutral-900">{totalReviews}</p>
          <p className="text-sm font-bold text-neutral-600 uppercase tracking-widest">Verified Reviews</p>
        </div>
      </div>

      {/* Right: Distribution */}
      <div className="space-y-3 lg:pl-4">
        <h3 className="text-base font-bold text-neutral-900 uppercase tracking-wider mb-6">Rating Distribution</h3>
        {[5, 4, 3, 2, 1].map((rating) => (
          <RatingBar key={rating} rating={rating} count={distribution[rating]} />
        ))}
      </div>
    </div>
  );
}
