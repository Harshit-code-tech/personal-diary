export default function Loading() {
  return (
    <div className="min-h-screen bg-paper dark:bg-midnight">
      <nav className="border-b border-charcoal/10 dark:border-white/10 bg-white dark:bg-graphite">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-8 w-48 bg-charcoal/10 dark:bg-white/10 rounded animate-pulse"></div>
          <div className="flex items-center gap-6">
            <div className="h-4 w-16 bg-charcoal/10 dark:bg-white/10 rounded animate-pulse"></div>
            <div className="h-4 w-16 bg-charcoal/10 dark:bg-white/10 rounded animate-pulse"></div>
            <div className="h-4 w-16 bg-charcoal/10 dark:bg-white/10 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-charcoal/10 dark:bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-10 w-48 bg-charcoal/10 dark:bg-white/10 rounded mb-8"></div>
          <div className="bg-white dark:bg-graphite rounded-lg shadow-sm p-8">
            <div className="h-4 w-full bg-charcoal/10 dark:bg-white/10 rounded mb-4"></div>
            <div className="h-4 w-3/4 bg-charcoal/10 dark:bg-white/10 rounded"></div>
          </div>
        </div>
      </main>
    </div>
  )
}
