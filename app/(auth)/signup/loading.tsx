export default function Loading() {
  return (
    <div className="min-h-screen bg-paper dark:bg-midnight flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-8 animate-pulse">
          <div className="h-8 bg-charcoal/10 dark:bg-white/10 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-charcoal/10 dark:bg-white/10 rounded w-1/2 mb-8"></div>
          <div className="space-y-6">
            <div className="h-12 bg-charcoal/10 dark:bg-white/10 rounded"></div>
            <div className="h-12 bg-charcoal/10 dark:bg-white/10 rounded"></div>
            <div className="h-12 bg-charcoal/10 dark:bg-white/10 rounded"></div>
            <div className="h-12 bg-gold/30 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
