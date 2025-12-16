'use client'

import { useState } from 'react'
import { Calendar, X } from 'lucide-react'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onDateRangeChange: (startDate: string, endDate: string) => void
  onClear: () => void
}

export default function DateRangePicker({
  startDate,
  endDate,
  onDateRangeChange,
  onClear
}: DateRangePickerProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate)
  const [localEndDate, setLocalEndDate] = useState(endDate)
  const [isOpen, setIsOpen] = useState(false)

  const handleApply = () => {
    onDateRangeChange(localStartDate, localEndDate)
    setIsOpen(false)
  }

  const handleClear = () => {
    setLocalStartDate('')
    setLocalEndDate('')
    onClear()
    setIsOpen(false)
  }

  const hasDateRange = startDate && endDate

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
          hasDateRange
            ? 'bg-gold/10 dark:bg-teal/10 border-gold dark:border-teal text-gold dark:text-teal'
            : 'border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white hover:bg-charcoal/5 dark:hover:bg-white/5'
        }`}
      >
        <Calendar className="w-5 h-5" />
        <span className="font-medium">
          {hasDateRange ? `${startDate} to ${endDate}` : 'Custom Date Range'}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-graphite border border-charcoal/20 dark:border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-charcoal dark:text-white">Select Date Range</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Start Date */}
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                    Start Date
                  </label>
                  <input
                    id="start-date"
                    name="startDate"
                    type="date"
                    value={localStartDate}
                    onChange={(e) => setLocalStartDate(e.target.value)}
                    max={localEndDate || undefined}
                    className="w-full px-3 py-2 bg-white dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                    End Date
                  </label>
                  <input
                    id="end-date"
                    name="endDate"
                    type="date"
                    value={localEndDate}
                    onChange={(e) => setLocalEndDate(e.target.value)}
                    min={localStartDate || undefined}
                    className="w-full px-3 py-2 bg-white dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <p className="text-sm font-medium text-charcoal dark:text-white mb-2">Quick Select</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const end = new Date()
                        const start = new Date(end)
                        start.setDate(end.getDate() - 7)
                        setLocalStartDate(start.toISOString().split('T')[0])
                        setLocalEndDate(end.toISOString().split('T')[0])
                      }}
                      className="px-3 py-2 text-sm bg-charcoal/5 dark:bg-white/5 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Last 7 Days
                    </button>
                    <button
                      onClick={() => {
                        const end = new Date()
                        const start = new Date(end)
                        start.setDate(end.getDate() - 30)
                        setLocalStartDate(start.toISOString().split('T')[0])
                        setLocalEndDate(end.toISOString().split('T')[0])
                      }}
                      className="px-3 py-2 text-sm bg-charcoal/5 dark:bg-white/5 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Last 30 Days
                    </button>
                    <button
                      onClick={() => {
                        const end = new Date()
                        const start = new Date(end)
                        start.setMonth(end.getMonth() - 3)
                        setLocalStartDate(start.toISOString().split('T')[0])
                        setLocalEndDate(end.toISOString().split('T')[0])
                      }}
                      className="px-3 py-2 text-sm bg-charcoal/5 dark:bg-white/5 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Last 3 Months
                    </button>
                    <button
                      onClick={() => {
                        const end = new Date()
                        const start = new Date(end.getFullYear(), 0, 1)
                        setLocalStartDate(start.toISOString().split('T')[0])
                        setLocalEndDate(end.toISOString().split('T')[0])
                      }}
                      className="px-3 py-2 text-sm bg-charcoal/5 dark:bg-white/5 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                      This Year
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-charcoal/10 dark:border-white/10">
                <button
                  onClick={handleClear}
                  className="flex-1 px-4 py-2 border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleApply}
                  disabled={!localStartDate || !localEndDate}
                  className="flex-1 px-4 py-2 bg-gold dark:bg-teal text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
