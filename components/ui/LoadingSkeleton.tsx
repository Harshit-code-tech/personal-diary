'use client'

export const EntryCardSkeleton = () => (
  <div className="bg-white dark:bg-graphite p-6 rounded-xl shadow-sm border border-charcoal/10 dark:border-white/10 animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
    </div>
  </div>
)

export const FolderItemSkeleton = () => (
  <div className="flex items-center gap-3 px-3 py-2 rounded-lg animate-pulse">
    <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
)

export const StoryCardSkeleton = () => (
  <div className="bg-white dark:bg-graphite rounded-xl shadow-sm border border-charcoal/10 dark:border-white/10 overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
    <div className="p-6">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  </div>
)

export const PersonCardSkeleton = () => (
  <div className="bg-white dark:bg-graphite p-6 rounded-xl shadow-sm border border-charcoal/10 dark:border-white/10 animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="flex-1">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
    </div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
  </div>
)

export const CalendarDaySkeleton = () => (
  <div className="aspect-square rounded-lg border border-charcoal/10 dark:border-white/10 p-2 animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-6 mb-2"></div>
    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
  </div>
)

export const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-graphite p-6 rounded-xl shadow-sm border border-charcoal/10 dark:border-white/10 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
    </div>
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
  </div>
)

export const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <EntryCardSkeleton key={i} />
    ))}
  </div>
)

export const GridSkeleton = ({ count = 6, type = 'story' }: { count?: number, type?: 'story' | 'person' }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(count)].map((_, i) => (
      type === 'story' ? <StoryCardSkeleton key={i} /> : <PersonCardSkeleton key={i} />
    ))}
  </div>
)

export const PageLoadingSkeleton = () => (
  <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
      </div>
      
      {/* Content skeleton */}
      <ListSkeleton count={3} />
    </div>
  </div>
)
