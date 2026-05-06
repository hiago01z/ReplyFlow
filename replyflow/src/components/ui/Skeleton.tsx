export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-4 bg-gray-100 rounded w-32" />
        <div className="h-4 bg-gray-100 rounded w-16" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-3/4" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-24 mb-3" />
      <div className="h-8 bg-gray-100 rounded w-16" />
    </div>
  );
}

export function SkeletonReviewCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-100 rounded-full shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
        <div className="h-6 bg-gray-100 rounded w-16" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-5/6 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  );
}
