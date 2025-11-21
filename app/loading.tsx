export default function Loading() {
  return (
    <div className="min-h-screen bg-paper dark:bg-midnight flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-charcoal dark:text-white">Loading...</p>
      </div>
    </div>
  )
}
