'use client'

import { useEffect, useState } from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'

const steps: Step[] = [
  {
    target: 'body',
    content: '👋 Welcome to Noted.! Let me show you around.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="new-entry"]',
    content: '📝 Click here to create a new journal entry. You can also press Ctrl+E!',
  },
  {
    target: '[data-tour="search"]',
    content: '🔍 Search all your entries instantly. Press Ctrl+K from anywhere!',
  },
  {
    target: '[data-tour="theme-switcher"]',
    content: '🎨 Switch between Light and Dark themes to match your preference.',
  },
  {
    target: '[data-tour="folders"]',
    content: '📁 Organize your entries with folders. Create custom folders or use auto-generated date folders.',
  },
  {
    target: '[data-tour="calendar"]',
    content: '📅 View your journaling activity on a calendar heatmap!',
  },
  {
    target: '[data-tour="insights"]',
    content: '📊 Track your mood patterns, writing streaks, and get insights!',
  },
  {
    target: 'body',
    content: "🎉 That's it! Start writing your first entry. Happy journaling!",
    placement: 'center',
  },
]

interface OnboardingTourProps {
  onComplete?: () => void
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [run, setRun] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration errors - only run client-side code after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Check if user has completed the tour
    const hasCompletedTour = localStorage.getItem('onboarding_completed')
    
    if (!hasCompletedTour) {
      // Delay tour start slightly to let page render
      const timer = setTimeout(() => {
        setRun(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [mounted])

  const handleCallback = (data: CallBackProps) => {
    const { status } = data
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem('onboarding_completed', 'true')
      setRun(false)
      onComplete?.()
    }
  }

  // Don't render anything until mounted to prevent hydration errors
  if (!mounted) {
    return null
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: '#D4AF37',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          fontSize: 16,
        },
        buttonNext: {
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 600,
        },
        buttonBack: {
          color: '#64748b',
          marginRight: 8,
        },
        buttonSkip: {
          color: '#94a3b8',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  )
}
