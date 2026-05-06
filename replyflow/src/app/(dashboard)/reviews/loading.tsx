import { SkeletonReviewCard } from "@/components/ui/Skeleton";

export default function ReviewsLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-7 bg-gray-100 rounded w-36 animate-pulse" />
      </div>
      {/* Filtros skeleton */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded-full w-24 animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonReviewCard key={i} />
        ))}
      </div>
    </div>
  );
}
