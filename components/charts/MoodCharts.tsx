'use client'

import { useState, useEffect } from 'react'

type MoodChartProps = {
  data: Array<{
    mood: string
    count: number
    percentage: number
  }>
  height?: number
}

export function MoodBarChart({ data, height = 300 }: MoodChartProps) {
  const [animated, setAnimated] = useState(false)
  
  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setAnimated(true), 100)
  }, [])

  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="bg-white dark:bg-graphite rounded-xl p-6 border border-gold/20 dark:border-teal/20 shadow-lg">
      <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">
        Mood Distribution
      </h3>
      
      <div className="flex items-end justify-between gap-4" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.count / maxCount) * 100
          const moodEmoji = item.mood.split(' ')[0]
          const moodName = item.mood.split(' ').slice(1).join(' ')

          return (
            <div key={item.mood} className="flex-1 flex flex-col items-center gap-3">
              {/* Bar */}
              <div className="w-full flex flex-col justify-end items-center" style={{ height: '100%' }}>
                <div className="relative w-full group">
                  {/* Hover tooltip */}
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    <div className="bg-charcoal dark:bg-white text-white dark:text-midnight px-4 py-2 rounded-lg shadow-xl text-sm font-bold whitespace-nowrap">
                      {item.count} entries ({item.percentage.toFixed(1)}%)
                    </div>
                  </div>
                  
                  {/* Bar element */}
                  <div
                    className="w-full rounded-t-xl transition-all duration-1000 ease-out"
                    style={{
                      height: animated ? `${barHeight}%` : '0%',
                      background: `linear-gradient(to top, 
                        hsl(${index * (360 / data.length)}, 70%, 60%), 
                        hsl(${index * (360 / data.length)}, 70%, 70%)
                      )`,
                      minHeight: barHeight > 0 ? '20px' : '0px',
                    }}
                  />
                </div>
              </div>

              {/* Label */}
              <div className="text-center space-y-1">
                <div className="text-2xl">{moodEmoji}</div>
                <div className="text-xs font-bold text-charcoal/70 dark:text-white/70 max-w-[80px] truncate">
                  {moodName}
                </div>
                <div className="text-xs text-charcoal/50 dark:text-white/50">
                  {item.count}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type TimelinePoint = {
  date: string
  mood: string
  count: number
}

export function MoodTimeline({ entries }: { entries: Array<{ entry_date: string; mood: string }> }) {
  // Group entries by date
  const dateMap = new Map<string, Map<string, number>>()
  
  entries.forEach(entry => {
    const date = entry.entry_date
    if (!dateMap.has(date)) {
      dateMap.set(date, new Map())
    }
    const moodMap = dateMap.get(date)!
    moodMap.set(entry.mood, (moodMap.get(entry.mood) || 0) + 1)
  })

  // Convert to array and sort by date
  const timeline: TimelinePoint[] = []
  dateMap.forEach((moodMap, date) => {
    moodMap.forEach((count, mood) => {
      timeline.push({ date, mood, count })
    })
  })
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Take last 30 days
  const last30Days = timeline.slice(-30)

  return (
    <div className="bg-white dark:bg-graphite rounded-xl p-6 border border-gold/20 dark:border-teal/20 shadow-lg">
      <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">
        Mood Timeline (Last 30 Days)
      </h3>
      
      {last30Days.length === 0 ? (
        <p className="text-center text-charcoal/50 dark:text-white/50 py-8">
          Not enough data for timeline
        </p>
      ) : (
        <div className="flex items-end gap-2 overflow-x-auto pb-4">
          {last30Days.map((point, index) => {
            const moodEmoji = point.mood.split(' ')[0]
            const date = new Date(point.date)

            return (
              <div
                key={index}
                className="group relative flex-shrink-0"
                style={{ width: '40px' }}
              >
                {/* Hover tooltip */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  <div className="bg-charcoal dark:bg-white text-white dark:text-midnight px-3 py-2 rounded-lg shadow-xl text-xs font-bold whitespace-nowrap">
                    <div>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div>{point.mood}</div>
                    <div>{point.count} {point.count === 1 ? 'entry' : 'entries'}</div>
                  </div>
                </div>

                {/* Mood circle */}
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 dark:from-teal/20 dark:to-teal/10 flex items-center justify-center text-2xl hover:scale-125 transition-transform duration-200 cursor-pointer shadow-md"
                  style={{
                    marginBottom: `${point.count * 4}px`,
                  }}
                >
                  {moodEmoji}
                </div>

                {/* Date label */}
                <div className="text-[8px] text-center text-charcoal/50 dark:text-white/50 mt-1">
                  {date.getDate()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

type MoodPieChartProps = {
  data: Array<{
    mood: string
    count: number
    percentage: number
  }>
}

export function MoodPieChart({ data }: MoodPieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Calculate angles for pie slices
  let currentAngle = -90 // Start from top
  const slices = data.map((item, index) => {
    const angle = (item.percentage / 100) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    return {
      ...item,
      startAngle,
      endAngle,
      color: `hsl(${index * (360 / data.length)}, 70%, 60%)`,
    }
  })

  return (
    <div className="bg-white dark:bg-graphite rounded-xl p-6 border border-gold/20 dark:border-teal/20 shadow-lg">
      <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">
        Mood Breakdown
      </h3>
      
      <div className="flex items-center justify-center gap-8">
        {/* Pie Chart (using CSS conic-gradient) */}
        <div className="relative w-48 h-48">
          <div
            className="w-full h-full rounded-full shadow-xl"
            style={{
              background: `conic-gradient(${slices
                .map(
                  (slice) =>
                    `${slice.color} ${((slice.startAngle + 90) / 360) * 100}% ${
                      ((slice.endAngle + 90) / 360) * 100
                    }%`
                )
                .join(', ')})`,
            }}
          />
          
          {/* Center circle for donut effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-white dark:bg-graphite rounded-full shadow-inner flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-charcoal dark:text-white">
                  {data.reduce((sum, item) => sum + item.count, 0)}
                </div>
                <div className="text-xs text-charcoal/60 dark:text-white/60">
                  Entries
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {slices.map((slice, index) => {
            const moodEmoji = slice.mood.split(' ')[0]
            const moodName = slice.mood.split(' ').slice(1).join(' ')

            return (
              <div
                key={slice.mood}
                className="flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className="w-4 h-4 rounded-sm shadow-sm"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-xl">{moodEmoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-charcoal dark:text-white">
                    {moodName}
                  </div>
                  <div className="text-xs text-charcoal/60 dark:text-white/60">
                    {slice.count} ({slice.percentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
