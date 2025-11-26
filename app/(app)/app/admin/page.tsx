'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Activity, 
  Database,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { 
  useIsAdmin, 
  getErrorLogs, 
  getAdminDashboardStats,
  getAllUserProfiles,
} from '@/lib/admin-utils'
import { PageLoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import Tooltip from '@/components/ui/Tooltip'

interface ErrorLog {
  id: string;
  error_type: string;
  message: string;
  stack: string | null;
  path: string;
  user_agent: string | null;
  created_at: string;
  user_id: string | null;
}

interface DashboardStats {
  totalErrors: number;
  errorsLast24h: number;
  uniqueUsers: number;
  totalUsers: number;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar_url?: string | null; // Optional since getAllUserProfiles doesn't return it
  admin_notes: string | null;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { isAdmin, loading: authLoading } = useIsAdmin()
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'errors' | 'users'>('overview')
  const [loading, setLoading] = useState(true)
  const [errorFilter, setErrorFilter] = useState<string>('')
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null)

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/app')
    }
  }, [isAdmin, authLoading, router])

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData()
    }
  }, [isAdmin])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [statsData, logsData, profilesData] = await Promise.all([
        getAdminDashboardStats(),
        getErrorLogs(50),
        getAllUserProfiles(),
      ])
      
      setStats(statsData)
      setErrorLogs(logsData)
      setUserProfiles(profilesData)
    } catch (error) {
      console.error('Failed to load admin dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !isAdmin) {
    return <PageLoadingSkeleton />
  }

  const filteredErrors = errorLogs.filter((log) =>
    errorFilter === '' || 
    log.error_type.toLowerCase().includes(errorFilter.toLowerCase()) ||
    log.message.toLowerCase().includes(errorFilter.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-midnight/80 border-b border-gold/20 dark:border-teal/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-xl">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-charcoal dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-charcoal/60 dark:text-white/60">
                  System monitoring and user management
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Tooltip content="Refresh data">
                <button
                  onClick={loadDashboardData}
                  disabled={loading}
                  className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gold/10 dark:hover:bg-teal/10 rounded-xl transition-colors active:scale-95"
                  aria-label="Refresh dashboard data"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </Tooltip>
              
              <button
                onClick={() => router.push('/app')}
                className="px-4 py-2 bg-charcoal dark:bg-white text-white dark:text-midnight rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Back to App
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'errors', label: 'Error Logs', icon: AlertTriangle },
            { id: 'users', label: 'Users', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gold dark:bg-teal text-white dark:text-midnight shadow-lg'
                  : 'bg-white dark:bg-graphite text-charcoal dark:text-white hover:bg-gold/10 dark:hover:bg-teal/10'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <PageLoadingSkeleton />
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Errors"
                  value={stats.totalErrors}
                  icon={AlertTriangle}
                  color="red"
                />
                <StatCard
                  title="Errors (24h)"
                  value={stats.errorsLast24h}
                  icon={AlertCircle}
                  color="amber"
                />
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="Active Users"
                  value={stats.uniqueUsers}
                  icon={Activity}
                  color="green"
                />
              </div>
            )}

            {/* Error Logs Tab */}
            {activeTab === 'errors' && (
              <div className="space-y-4">
                {/* Search/Filter */}
                <div className="flex items-center gap-3 bg-white dark:bg-graphite rounded-xl p-4 shadow-lg">
                  <Search className="w-5 h-5 text-charcoal/50 dark:text-white/50" />
                  <input
                    type="text"
                    placeholder="Filter by error type or message..."
                    value={errorFilter}
                    onChange={(e) => setErrorFilter(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-charcoal dark:text-white"
                  />
                  {errorFilter && (
                    <button
                      onClick={() => setErrorFilter('')}
                      className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Error logs list */}
                <div className="space-y-2">
                  {filteredErrors.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white dark:bg-graphite rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => setSelectedError(log)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold rounded">
                              {log.error_type}
                            </span>
                            <span className="text-xs text-charcoal/50 dark:text-white/50">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-charcoal dark:text-white font-medium truncate">
                            {log.message}
                          </p>
                          <p className="text-xs text-charcoal/60 dark:text-white/60 mt-1">
                            Path: {log.path}
                          </p>
                        </div>
                        <button className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredErrors.length === 0 && (
                    <div className="text-center py-12 text-charcoal/60 dark:text-white/60">
                      No error logs found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white dark:bg-graphite rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-charcoal/5 dark:bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-charcoal dark:text-white">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-charcoal dark:text-white">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-charcoal dark:text-white">
                          Joined
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-charcoal dark:text-white">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-charcoal/10 dark:divide-white/10">
                      {userProfiles.map((user) => (
                        <tr key={user.id} className="hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-sm text-charcoal dark:text-white">
                            {user.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-charcoal dark:text-white">
                            {user.email}
                          </td>
                          <td className="px-4 py-3 text-sm text-charcoal/60 dark:text-white/60">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-charcoal/60 dark:text-white/60">
                            {user.admin_notes || 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {userProfiles.length === 0 && (
                    <div className="text-center py-12 text-charcoal/60 dark:text-white/60">
                      No users found
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-graphite rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-graphite border-b border-charcoal/10 dark:border-white/10 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-charcoal dark:text-white">
                Error Details
              </h3>
              <button
                onClick={() => setSelectedError(null)}
                className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-charcoal/60 dark:text-white/60">
                  Error Type
                </label>
                <p className="text-charcoal dark:text-white font-medium">
                  {selectedError.error_type}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-charcoal/60 dark:text-white/60">
                  Message
                </label>
                <p className="text-charcoal dark:text-white">
                  {selectedError.message}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-charcoal/60 dark:text-white/60">
                  Path
                </label>
                <p className="text-charcoal dark:text-white font-mono text-sm">
                  {selectedError.path}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-charcoal/60 dark:text-white/60">
                  Timestamp
                </label>
                <p className="text-charcoal dark:text-white">
                  {new Date(selectedError.created_at).toLocaleString()}
                </p>
              </div>
              
              {selectedError.stack && (
                <div>
                  <label className="text-sm font-semibold text-charcoal/60 dark:text-white/60">
                    Stack Trace
                  </label>
                  <pre className="mt-2 p-4 bg-charcoal/5 dark:bg-white/5 rounded-lg text-xs overflow-x-auto">
                    {selectedError.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'red' | 'amber' | 'blue' | 'green';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colors = {
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
  };

  return (
    <div className="bg-white dark:bg-graphite rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-3xl font-bold text-charcoal dark:text-white mb-1">
        {value.toLocaleString()}
      </p>
      <p className="text-sm text-charcoal/60 dark:text-white/60">
        {title}
      </p>
    </div>
  );
}
