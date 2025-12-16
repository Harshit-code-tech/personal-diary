'use client'

import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

interface EntryCount {
  date: string
  count: number
}

export default function CalendarView() {
  const [data, setData] = useState<EntryCount[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchEntryData = useCallback(async () => {
    try {
      // Get entries from the last year
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      const { data: entries, error } = await supabase
        .from('entries')
        .select('entry_date')
        .gte('entry_date', oneYearAgo.toISOString().split('T')[0])
        .order('entry_date')

      if (error) throw error

      // Count entries per day
      const counts: { [key: string]: number } = {}
      entries?.forEach(entry => {
        const date = entry.entry_date
        counts[date] = (counts[date] || 0) + 1
      })

      const heatmapData = Object.entries(counts).map(([date, count]) => ({
        date,
        count,
      }))

      setData(heatmapData)
      
      // Calculate streaks
      const sortedDates = Object.keys(counts).sort()
      let current = 0
      let longest = 0
      let tempStreak = 0
      
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      
      // Check if current streak is active
      if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
        for (let i = sortedDates.length - 1; i >= 0; i--) {
          const currentDate = new Date(sortedDates[i])
          const nextDate = i < sortedDates.length - 1 ? new Date(sortedDates[i + 1]) : new Date()
          const dayDiff = Math.floor((nextDate.getTime() - currentDate.getTime()) / 86400000)
          
          if (dayDiff <= 1) {
            current++
          } else {
            break
          }
        }
      }
      
      // Calculate longest streak
      tempStreak = 1
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const currentDate = new Date(sortedDates[i])
        const nextDate = new Date(sortedDates[i + 1])
        const dayDiff = Math.floor((nextDate.getTime() - currentDate.getTime()) / 86400000)
        
        if (dayDiff === 1) {
          tempStreak++
          longest = Math.max(longest, tempStreak)
        } else {
          tempStreak = 1
        }
      }
      
      setCurrentStreak(current)
      setLongestStreak(Math.max(longest, current))
    } catch (error) {
      console.error('Error fetching entry data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!user) return

    fetchEntryData()
  }, [user, fetchEntryData])

  const getColorClass = (value: any) => {
    if (!value || value.count === 0) return 'color-empty'
    if (value.count >= 5) return 'color-scale-4'
    if (value.count >= 3) return 'color-scale-3'
    if (value.count >= 2) return 'color-scale-2'
    if (value.count >= 1) return 'color-scale-1'
    return 'color-empty'
  }

  if (loading) {

    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-charcoal dark:text-white">Loading calendar...</div>
      </div>
    )
  }

  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold text-charcoal dark:text-teal mb-2">
            Your Journaling Journey
          </h2>
          <p className="text-charcoal/70 dark:text-white/70">
            Visualize your writing habits over the past year
          </p>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="bg-white dark:bg-graphite rounded-lg shadow-sm p-8">
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={data}
          classForValue={getColorClass}
          titleForValue={(value: any) => {
            if (!value || !value.date) return ''
            return `${value.date}: ${value.count} ${value.count === 1 ? 'entry' : 'entries'}`
          }}
          showWeekdayLabels
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-charcoal/70 dark:text-white/70">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-paper dark:bg-midnight border border-charcoal/10 dark:border-white/10 rounded"></div>
          <div className="w-4 h-4 bg-gold/30 dark:bg-teal/30 rounded"></div>
          <div className="w-4 h-4 bg-gold/60 dark:bg-teal/60 rounded"></div>
          <div className="w-4 h-4 bg-gold dark:bg-teal rounded"></div>
        </div>
        <span>More</span>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          icon="🔥"
          label="Current Streak"
          value={currentStreak === 0 ? '0 days' : `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`}
        />
        <StatCard
          icon="🏆"
          label="Longest Streak"
          value={longestStreak === 0 ? '0 days' : `${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}`}
        />
        <StatCard
          icon="📝"
          label="Total Entries"
          value={data.reduce((sum, item) => sum + item.count, 0).toString()}
        />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-graphite rounded-lg shadow-sm p-6 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-2xl font-bold text-charcoal dark:text-teal mb-1">{value}</div>
      <div className="text-sm text-charcoal/70 dark:text-white/70">{label}</div>
    </div>
  )
}
