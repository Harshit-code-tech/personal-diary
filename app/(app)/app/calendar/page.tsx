import CalendarView from '@/components/calendar/CalendarView'

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-paper dark:bg-midnight">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <CalendarView />
        </div>
      </div>
    </div>
  )
}
