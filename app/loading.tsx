export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
          <div className="absolute inset-0 border-4 border-gold/20 dark:border-teal/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-gold dark:border-teal rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-base sm:text-lg font-medium text-charcoal/70 dark:text-white/70 animate-pulse">
          Loading your diary...
        </p>
      </div>
    </div>
  )
}
