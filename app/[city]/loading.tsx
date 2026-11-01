export default function CityLoading() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-950 pb-16 animate-pulse">
      {/* Top Banner / Filter Bar Skeleton */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-64"></div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg flex-1 md:w-48"></div>
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg flex-1 md:w-48"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {/* Category Navigation Pills Skeleton */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shrink-0"
            ></div>
          ))}
        </div>

        {/* Listings Grid Skeleton */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm"
            >
              <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800"></div>
              <div className="p-4 space-y-3">
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
