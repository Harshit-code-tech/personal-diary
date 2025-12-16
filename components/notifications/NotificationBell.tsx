'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Bell, X, Check } from 'lucide-react'
import Link from 'next/link'

type Notification = {
  id: string
  title: string
  message: string | null
  type: string
  is_read: boolean
  related_id: string | null
  created_at: string
}

export default function NotificationBell() {
  const { user } = useAuth()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPanel, setShowPanel] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, supabase])

  useEffect(() => {
    if (user) {
      fetchNotifications()
      
      // Subscribe to new notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, fetchNotifications, supabase])

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      const notification = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.type === 'reminder') {
      return '/app/reminders'
    }
    return null
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (!user) return null

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2.5 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-all duration-300 rounded-xl hover:bg-gold/10 dark:hover:bg-teal/10"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {showPanel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-white dark:bg-graphite rounded-xl shadow-2xl border border-charcoal/10 dark:border-white/10 z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-charcoal/10 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-lg text-charcoal dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-gold dark:text-teal hover:underline flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[500px]">
              {loading ? (
                <div className="p-8 text-center text-charcoal/60 dark:text-white/60">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto text-charcoal/20 dark:text-white/20 mb-3" />
                  <p className="text-charcoal/60 dark:text-white/60">
                    No notifications yet
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-charcoal/10 dark:divide-white/10">
                  {notifications.map((notification) => {
                    const link = getNotificationLink(notification)
                    const NotificationContent = (
                      <div
                        className={`p-4 hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors ${
                          !notification.is_read ? 'bg-gold/5 dark:bg-teal/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-charcoal dark:text-white text-sm">
                                {notification.title}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                                className="flex-shrink-0 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              >
                                <X className="w-4 h-4 text-red-500 dark:text-red-400" />
                              </button>
                            </div>
                            {notification.message && (
                              <p className="text-sm text-charcoal/70 dark:text-white/70 mt-1">
                                {notification.message}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-charcoal/50 dark:text-white/50">
                                {formatTimestamp(notification.created_at)}
                              </span>
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                  }}
                                  className="text-xs text-gold dark:text-teal hover:underline"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-gold dark:bg-teal rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    )

                    return link ? (
                      <Link
                        key={notification.id}
                        href={link}
                        onClick={() => {
                          markAsRead(notification.id)
                          setShowPanel(false)
                        }}
                      >
                        {NotificationContent}
                      </Link>
                    ) : (
                      <div key={notification.id}>{NotificationContent}</div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
