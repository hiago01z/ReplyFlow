export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-3 bg-gray-100 rounded w-20 mb-2" />
        <div className="h-7 bg-gray-100 rounded w-56 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-80" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 h-[120px]">
            <div className="w-10 h-10 bg-gray-100 rounded-xl mb-3" />
            <div className="h-7 bg-gray-100 rounded w-16 mb-1.5" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2 h-[340px]">
          <div className="h-4 bg-gray-100 rounded w-40 mb-4" />
          <div className="h-[260px] bg-gray-50 rounded-xl" />
        </div>
        <div className="card p-5 h-[340px]">
          <div className="h-4 bg-gray-100 rounded w-32 mb-4" />
          <div className="h-[260px] bg-gray-50 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
