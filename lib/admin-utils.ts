// Admin Utilities for Client-Side Code
// Use these in your Next.js app to check admin status and perform admin actions

import { createClient } from '@/lib/supabase/client'
import React from 'react'
import { useRouter } from 'next/navigation'

/**
 * Check if current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('is_admin')
    
    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }
    
    return data === true
  } catch (error) {
    console.error('Failed to check admin status:', error)
    return false
  }
}

/**
 * Get current user's role
 * @returns 'admin' | 'moderator' | 'user'
 */
export async function getCurrentUserRole(): Promise<'admin' | 'moderator' | 'user'> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.rpc('get_user_role')
    
    if (error) {
      console.error('Error getting user role:', error)
      return 'user'
    }
    
    return data || 'user'
  } catch (error) {
    console.error('Failed to get user role:', error)
    return 'user'
  }
}

/**
 * Get all error logs (admin only)
 */
export async function getErrorLogs(limit = 50) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching error logs:', error)
    return []
  }
  
  return data || []
}

/**
 * Get admin dashboard stats (admin only)
 */
export async function getAdminDashboardStats() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('admin_dashboard')
    .select('*')
    .single()
  
  if (error) {
    console.error('Error fetching dashboard stats:', error)
    return null
  }
  
  return data
}

/**
 * Get all user profiles (admin only)
 */
export async function getAllUserProfiles() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, created_at, admin_notes')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user profiles:', error)
    return []
  }
  
  return data || []
}

/**
 * Get all user roles (admin only)
 */
export async function getAllUserRoles() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      id,
      role,
      granted_at,
      user:auth.users(email)
    `)
    .order('granted_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user roles:', error)
    return []
  }
  
  return data || []
}

/**
 * Get admin activity log (admin only)
 */
export async function getAdminActivityLog(limit = 100) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('admin_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching activity log:', error)
    return []
  }
  
  return data || []
}

/**
 * Log admin activity
 */
export async function logAdminActivity(
  action: string,
  targetUserId?: string,
  details?: Record<string, any>
) {
  const supabase = createClient()
  
  const { error } = await supabase.rpc('log_admin_activity', {
    p_action: action,
    p_target_user_id: targetUserId || null,
    p_details: details || null
  })
  
  if (error) {
    console.error('Error logging admin activity:', error)
  }
}

/**
 * Delete an error log (admin only)
 */
export async function deleteErrorLog(errorId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('error_logs')
    .delete()
    .eq('id', errorId)
  
  if (error) {
    console.error('Error deleting error log:', error)
    return false
  }
  
  await logAdminActivity('delete_error_log', undefined, { error_id: errorId })
  return true
}

/**
 * Higher-order component to protect admin routes
 * 
 * @example
 * ```typescript
 * const AdminPage = withAdminAuth(YourAdminComponent)
 * ```
 */
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function AdminProtectedComponent(props: P) {
    const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null)
    const router = useRouter()
    
    React.useEffect(() => {
      async function checkAdmin() {
        const adminStatus = await isCurrentUserAdmin()
        setIsAdmin(adminStatus)
        
        if (!adminStatus) {
          router.push('/app')
        }
      }
      
      checkAdmin()
    }, [router])
    
    if (isAdmin === null) {
      return React.createElement('div', null, 'Loading...')
    }
    
    if (!isAdmin) {
      return null
    }
    
    return React.createElement(Component, props)
  }
}

/**
 * Hook to check admin status
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null)
  const [loading, setLoading] = React.useState(true)
  
  React.useEffect(() => {
    async function checkAdmin() {
      const adminStatus = await isCurrentUserAdmin()
      setIsAdmin(adminStatus)
      setLoading(false)
    }
    
    checkAdmin()
  }, [])
  
  return { isAdmin, loading }
}

/**
 * Hook to get user role
 */
export function useUserRole() {
  const [role, setRole] = React.useState<'admin' | 'moderator' | 'user'>('user')
  const [loading, setLoading] = React.useState(true)
  
  React.useEffect(() => {
    async function fetchRole() {
      const userRole = await getCurrentUserRole()
      setRole(userRole)
      setLoading(false)
    }
    
    fetchRole()
  }, [])
  
  return { role, loading, isAdmin: role === 'admin' }
}
