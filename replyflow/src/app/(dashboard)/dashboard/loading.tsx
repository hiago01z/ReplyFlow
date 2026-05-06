import { SkeletonStat, SkeletonReviewCard } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-7 bg-gray-100 rounded w-48 animate-pulse" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>
      {/* Reviews */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonReviewCard key={i} />
        ))}
      </div>
    </div>
  );
}
