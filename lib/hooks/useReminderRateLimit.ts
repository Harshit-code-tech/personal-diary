import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export interface ReminderRateLimit {
  reminders_created_today: number
  max_reminders_per_day: number
  active_reminders: number
  max_active_reminders: number
  can_create_more: boolean
  reset_at: string
}

export function useReminderRateLimit() {
  const { user } = useAuth()
  const supabase = createClient()

  return useQuery({
    queryKey: ['reminderRateLimit', user?.id],
    queryFn: async (): Promise<ReminderRateLimit> => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase.rpc('get_reminder_rate_limit_status', {
        p_user_id: user.id,
      })

      if (error) throw error
      
      // data is an array with single object
      return data?.[0] || {
        reminders_created_today: 0,
        max_reminders_per_day: 50,
        active_reminders: 0,
        max_active_reminders: 20,
        can_create_more: true,
        reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  })
}
