import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import logoImage from '../assets/Mann-mitra.png'
import { useApi } from '../hooks/useApi'
import { clearStoredAuth } from '../utils/routeAuth'

const AdminDashboardNew = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { callApi } = useApi()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [counsellors, setCounsellors] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddCounsellor, setShowAddCounsellor] = useState(false)
  const [apiError, setApiError] = useState(null)
  
  // Get admin user data from localStorage
  const adminUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('Mann-Mitra_user') || '{}')
  const adminName = adminUser?.name || adminUser?.username || 'Admin'
  const adminEmail = adminUser?.email || ''

  useEffect(() => {
    setApiError(null)
    if (activeTab === 'overview') {
      fetchDashboardData()
    } else if (activeTab === 'counsellors') {
      fetchCounsellors()
    } else {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setApiError(null)
    try {
      const result = await callApi('/api/v1/admin/overview', 'GET')
      if (result.success && result.data) {
        setDashboardData(result.data?.overview ? { overview: result.data.overview } : result.data)
      } else {
        setDashboardData({ overview: { totalUsers: 0, activeCounsellors: 0, todayAppointments: 0, crisisAlerts: 0 } })
      }
    } catch (err) {
      setApiError(err.message || 'Failed to fetch dashboard data')
      setDashboardData({ overview: { totalUsers: 0, activeCounsellors: 0, todayAppointments: 0, crisisAlerts: 0 } })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCounsellors = async () => {
    setApiError(null)
    try {
      const result = await callApi('/api/v1/admin/counsellors', 'GET')
      if (result.success && result.data) {
        const list = Array.isArray(result.data) ? result.data : (result.data?.data ?? [])
        setCounsellors(list)
      } else {
        setCounsellors([])
        if (!result.success) setApiError(result.error || 'Failed to fetch counsellors')
      }
    } catch (err) {
      setApiError(err.message || 'Failed to fetch counsellors')
      setCounsellors([])
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'risk-dashboard', name: 'Risk Dashboard' },
    { id: 'counsellors', name: 'Counsellors' },
    { id: 'peer-approval', name: 'Peer Approval' },
    { id: 'students', name: 'Student Analytics' },
    { id: 'crisis', name: 'Crisis Management' },
    { id: 'reports', name: 'Reports' },
    { id: 'courses', name: 'Courses' }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-800 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#1A1A1A] border-r border-gray-800 flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <img 
              src={logoImage} 
              alt="Mann-Mitra Logo" 
              className="h-10 w-auto brightness-0 invert"
            />
            <div>
              <h1 className="text-lg font-bold text-[#00D9D9]">{adminName}</h1>
              <p className="text-[10px] text-gray-400 tracking-wider uppercase">Executive Terminal</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {[
            { id: 'overview', name: 'Overview', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )},
            { id: 'risk-dashboard', name: 'Risk Dashboard', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )},
            { id: 'counsellors', name: 'Counsellors', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )},
            { id: 'students', name: 'Analytics', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )},
            { id: 'reports', name: 'Reports', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )},
            { id: 'settings', name: 'Settings', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-[#00D9D9]/10 text-[#00D9D9] border-l-4 border-[#00D9D9]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              {tab.icon}
              <span className="font-medium text-sm">{tab.name}</span>
            </button>
          ))}
        </nav>

        {/* User Profile Section with Logout */}
        <div className="p-4 border-t border-gray-800">
          <div className="mb-3 px-3 py-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#00D9D9]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#00D9D9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{adminName}</p>
                <p className="text-xs text-gray-400 truncate">{adminEmail || 'Admin Access'}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              clearStoredAuth()
              navigate('/admin/login')
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors border border-red-800/50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-[#1A1A1A] border-b border-gray-800 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search system terminal..."
                  className="w-full bg-[#0A0A0A] border border-gray-700 rounded-lg px-4 py-2 pl-10 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#00D9D9] transition-colors"
                />
                <span className="absolute left-3 top-2.5 text-gray-500">🔍</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 ml-4">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button className="bg-[#00D9D9] text-black px-5 py-2 rounded-lg hover:bg-[#00C0C0] font-medium text-sm transition-all flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Executive Export</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content with Dark Background */}
        <main className="flex-1 bg-[#0A0A0A] overflow-y-auto">
          {/* Page Title Section */}
          <div className="px-8 py-6 border-b border-gray-800">
            <h2 className="text-3xl font-bold text-white">Mann-Mitra Oversight</h2>
            <p className="text-gray-400 mt-1">High-level diagnostics and executive controls for the mental wellness infrastructure.</p>
          </div>

          {/* Error Notification */}
          {apiError && (
            <div className="px-8 pt-4">
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-400">{apiError}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      type="button"
                      onClick={() => setApiError(null)}
                      className="inline-flex bg-red-900/20 rounded-md p-1.5 text-red-400 hover:bg-red-900/30"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="px-8 py-6">
            {activeTab === 'overview' && <OverviewTab data={dashboardData} />}
            {activeTab === 'risk-dashboard' && <RiskDashboardTab />}
            {activeTab === 'counsellors' && (
              <CounsellorManagementTab 
                counsellors={counsellors} 
                onRefresh={fetchCounsellors}
                showAddForm={showAddCounsellor}
                setShowAddForm={setShowAddCounsellor}
                callApi={callApi}
              />
            )}
            {activeTab === 'students' && <StudentAnalyticsTab />}
            {activeTab === 'reports' && <ReportsTab callApi={callApi} />}
            {activeTab === 'settings' && <SettingsTab adminUser={adminUser} adminName={adminName} adminEmail={adminEmail} callApi={callApi} />}
          </div>
        </main>
      </div>
    </div>
  )
}

// Risk Dashboard Tab - Real-time risk monitoring from Buddy RAG service
const RiskDashboardTab = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRiskDashboard()
    const interval = setInterval(fetchRiskDashboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchRiskDashboard = async () => {
    try {
      const buddyUrl = import.meta.env.VITE_BUDDY_AGENT_URL || 'http://localhost:8000'
      const response = await fetch(`${buddyUrl}/admin/risk-dashboard`)
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
        setError(null)
      } else {
        setError('Failed to fetch risk dashboard')
      }
    } catch (err) {
      setError('Buddy RAG service is not reachable')
    } finally {
      setLoading(false)
    }
  }

  const riskColors = {
    low: { bg: 'bg-green-900/20', text: 'text-green-400', bar: 'bg-[#00D9D9]', border: 'border-green-800' },
    medium: { bg: 'bg-yellow-900/20', text: 'text-yellow-400', bar: 'bg-yellow-500', border: 'border-yellow-800' },
    high: { bg: 'bg-orange-900/20', text: 'text-orange-400', bar: 'bg-orange-500', border: 'border-orange-800' },
    critical: { bg: 'bg-red-900/20', text: 'text-red-400', bar: 'bg-red-500', border: 'border-red-800' },
  }

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9D9] mx-auto"></div><p className="mt-4 text-gray-400">Loading risk data...</p></div>
  if (error) return <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center"><p className="text-red-400 font-medium">{error}</p><button onClick={fetchRiskDashboard} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button></div>

  const dist = dashboardData?.severity_distribution || {}
  const totalSessions = Object.values(dist).reduce((sum, d) => sum + (d.count || 0), 0) || 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Risk Monitoring Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">Real-time monitoring of high-risk sessions and alerts</p>
        </div>
        <button onClick={fetchRiskDashboard} className="px-4 py-2 bg-[#00D9D9] text-black rounded-lg hover:bg-[#00C0C0] text-sm font-medium transition-all">Refresh</button>
      </div>

      {/* Severity Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['critical', 'high', 'medium', 'low'].map(level => {
          const d = dist[level] || { count: 0, avg_score: 0 }
          const colors = riskColors[level]
          return (
            <div key={level} className={`${colors.bg} rounded-xl p-5 border ${colors.border} backdrop-blur-sm`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold uppercase ${colors.text}`}>{level}</span>
                <span className={`text-3xl font-bold ${colors.text}`}>{d.count}</span>
              </div>
              <p className={`text-xs mt-1 ${colors.text} opacity-70`}>Avg Score: {d.avg_score || 0}/100</p>
              <div className="mt-2 w-full bg-black/30 rounded-full h-2">
                <div className={`${colors.bar} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min((d.count / totalSessions) * 100, 100)}%` }}></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* High Risk Active Cases */}
      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 bg-black/30">
          <h3 className="font-semibold text-white">High-Risk Active Cases</h3>
          <p className="text-sm text-gray-400">Sessions flagged as high or critical risk (anonymized)</p>
        </div>
        <div className="divide-y divide-gray-800">
          {(!dashboardData?.high_risk_cases || dashboardData.high_risk_cases.length === 0) ? (
            <div className="px-6 py-8 text-center text-gray-500">No high-risk cases at this time</div>
          ) : (
            dashboardData.high_risk_cases.map((c, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${c.risk_level === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`}>
                    {c.risk_score}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {c.display_name || c.user_name || c.anonymous_id}
                      {c.user_name && <span className="ml-2 text-xs text-gray-500 font-normal">({c.anonymous_id})</span>}
                    </p>
                    <p className="text-sm text-gray-400 max-w-md truncate">{c.risk_summary}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${riskColors[c.risk_level]?.bg} ${riskColors[c.risk_level]?.text} ${riskColors[c.risk_level]?.border}`}>
                    {c.risk_level}
                  </span>
                  <span className="text-xs text-gray-500">{c.interaction_count} msgs</span>
                  {c.mood_trend && c.mood_trend.length > 1 && (
                    <div className="flex items-end space-x-0.5 h-6">
                      {c.mood_trend.slice(-8).map((s, j) => (
                        <div key={j} className={`w-1.5 rounded-t ${s > 60 ? 'bg-red-400' : s > 30 ? 'bg-yellow-400' : 'bg-green-400'}`} style={{ height: `${Math.max(s / 100 * 24, 2)}px` }}></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 bg-black/30">
          <h3 className="font-semibold text-white">Recent Risk Alerts</h3>
        </div>
        <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
          {(!dashboardData?.recent_alerts || dashboardData.recent_alerts.length === 0) ? (
            <div className="px-6 py-8 text-center text-gray-500">No recent alerts</div>
          ) : (
            dashboardData.recent_alerts.map((a, i) => (
              <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className={`w-2 h-2 rounded-full ${riskColors[a.risk_level]?.bar}`}></span>
                  <span className="text-sm text-gray-300 max-w-lg truncate">{a.risk_summary}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-xs border ${riskColors[a.risk_level]?.bg} ${riskColors[a.risk_level]?.text} ${riskColors[a.risk_level]?.border}`}>
                    {a.risk_score}/100
                  </span>
                  <span className="text-xs text-gray-500">
                    {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Overview Tab Component - Premium Dark Theme
const OverviewTab = ({ data }) => {
  if (!data) return <div className="text-gray-400">Loading...</div>

  const stats = [
    { 
      label: 'TOTAL USERS', 
      value: data.overview?.totalUsers || 24500, 
      change: '+12%', 
      status: 'Steady',
      accent: 'bg-gradient-to-br from-[#00D9D9] to-[#00A0A0]',
      miniChart: [45, 52, 48, 60, 55, 70, 85] // Mock data for mini chart
    },
    { 
      label: 'ACTIVE COUNSELLORS', 
      value: data.overview?.activeCounsellors || 85, 
      change: '+5%', 
      status: 'Steady',
      accent: 'bg-gradient-to-br from-[#00D9D9] to-[#00A0A0]',
      miniChart: [60, 55, 62, 58, 65, 70, 85]
    },
    { 
      label: 'APPOINTMENTS TODAY', 
      value: data.overview?.todayAppointments || 32, 
      change: '+4%', 
      status: 'Steady',
      accent: 'bg-gradient-to-br from-[#00D9D9] to-[#00A0A0]',
      miniChart: [20, 25, 30, 28, 35, 38, 42]
    },
    { 
      label: 'CRISIS ALERTS', 
      value: data.overview?.crisisAlerts || 4, 
      change: 'High Priority', 
      status: 'High Priority',
      accent: 'bg-gradient-to-br from-orange-500 to-yellow-500',
      miniChart: [2, 3, 2, 4, 3, 5, 4]
    }
  ]

  const activityLog = [
    { type: 'registration', icon: '👥', title: 'New Student Registration', user: 'Sarah J', time: '1min ago', status: 'PENDING', statusColor: 'bg-gray-600' },
    { type: 'session', icon: '📋', title: 'Counselling Session', user: 'Dr. Patel', time: '15 mins ago', status: 'COMPLETED', statusColor: 'bg-[#00D9D9]' },
    { type: 'alert', icon: '⚠️', title: 'High Risk Alert', user: 'Student 1024', time: '30 mins ago', status: 'INVESTIGATING', statusColor: 'bg-red-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid with Mini Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden hover:border-[#00D9D9]/50 transition-all group">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
                </div>
                <span className={`px-2 py-1 text-[10px] font-medium ${index === 3 ? 'bg-orange-900/30 text-orange-400' : 'bg-[#00D9D9]/10 text-[#00D9D9]'} rounded`}>
                  {stat.change}
                </span>
              </div>
              
              {/* Mini Bar Chart */}
              <div className="flex items-end space-x-1 h-12 mt-3">
                {stat.miniChart.map((height, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 ${index === 3 ? 'bg-gradient-to-t from-yellow-500/50 to-orange-500/50' : 'bg-gradient-to-t from-[#00D9D9]/30 to-[#00D9D9]'} rounded-t transition-all duration-300 group-hover:opacity-100 opacity-70`}
                    style={{ height: `${height}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Log */}
        <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 bg-black/30 flex items-center justify-between">
            <h3 className="font-semibold text-white">Recent Activity Log</h3>
            <a href="#" className="text-xs text-[#00D9D9] hover:underline">View Terminal Full-Log</a>
          </div>
          <div className="divide-y divide-gray-800">
            {activityLog.map((activity, i) => (
              <div key={i} className="px-6 py-4 flex items-center space-x-4 hover:bg-gray-800/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D9D9]/20 to-[#00D9D9]/5 flex items-center justify-center text-lg border border-[#00D9D9]/20">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{activity.title}</p>
                  <p className="text-xs text-gray-400">{activity.user} · {activity.time}</p>
                </div>
                <span className={`px-3 py-1 text-[10px] font-medium ${activity.statusColor} text-white rounded uppercase tracking-wide`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 bg-black/30">
            <h3 className="font-semibold text-white">Risk Distribution</h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { level: 'Severe', count: 2, color: 'bg-red-500', width: '15%' },
              { level: 'Moderate', count: 8, color: 'bg-orange-500', width: '45%' },
              { level: 'Low', count: 50, color: 'bg-[#00D9D9]', width: '95%' }
            ].map((risk, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">{risk.level}</span>
                  <span className="text-sm font-medium text-white">{risk.count}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className={`${risk.color} h-2 rounded-full transition-all duration-500`} 
                    style={{ width: risk.width }}
                  ></div>
                </div>
              </div>
            ))}

            {/* Executive Summary */}
            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Executive Summary</p>
              <p className="text-sm text-gray-300 italic leading-relaxed">
                "Current sentiment tracking indicates a 4% rise in engagement within the last 24h. Crisis response teams are at optimal capacity."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Counsellor Management Tab Component - Premium Dark Theme
const CounsellorManagementTab = ({ counsellors, onRefresh, showAddForm, setShowAddForm, callApi }) => {
  const [editingCounsellor, setEditingCounsellor] = useState(null)
  const [viewingCounsellor, setViewingCounsellor] = useState(null)
  
  // Mock data if no real counsellors
  const displayCounsellors = counsellors?.length > 0 ? counsellors : [
    { _id: 'mock1', name: 'Dr. Sarah Johnson', email: 'sarah@example.com', department: 'Clinical Psychology', specialization: 'Anxiety & Depression', isActive: true },
    { _id: 'mock2', name: 'Dr. Michael Chen', email: 'michael@example.com', department: 'Counseling', specialization: 'Trauma Therapy', isActive: true },
    { _id: 'mock3', name: 'Dr. Emily Rodriguez', email: 'emily@example.com', department: 'Mental Health', specialization: 'General Counselling', isActive: false }
  ]

  const handleToggleStatus = async (counsellor) => {
    const id = counsellor._id || counsellor.id
    if (id.startsWith('mock')) {
      alert('This is mock data. Real counsellor status can be toggled.')
      return
    }
    try {
      const result = await callApi(`/api/v1/admin/counsellors/${id}/status`, 'PATCH', {
        isActive: counsellor.isActive === false ? true : false
      })
      if (result.success) {
        onRefresh()
      } else {
        alert(result.error || result.message || 'Failed to update status')
      }
    } catch (e) {
      alert(e.message || 'Failed to update status')
    }
  }

  const handleDelete = async (counsellor) => {
    const id = counsellor._id || counsellor.id
    if (id.startsWith('mock')) {
      alert('This is mock data. Real counsellors can be deleted.')
      return
    }
    if (!window.confirm(`Are you sure you want to delete "${counsellor.name}"? This action cannot be undone.`)) return
    try {
      const result = await callApi(`/api/v1/admin/counsellors/${id}`, 'DELETE')
      if (result.success) {
        onRefresh()
      } else {
        alert(result.error || result.message || 'Failed to delete')
      }
    } catch (e) {
      alert(e.message || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Counsellor Management</h2>
          <p className="text-gray-400 mt-1">Add, edit, and manage counsellor accounts</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-[#00D9D9] text-black px-5 py-2.5 rounded-lg hover:bg-[#00C0C0] font-medium text-sm transition-all flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Counsellor</span>
        </button>
      </div>

      {showAddForm && (
        <AddCounsellorForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false)
            onRefresh()
          }}
          callApi={callApi}
        />
      )}

      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 bg-black/30">
          <h3 className="font-semibold text-white">Current Counsellors</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-black/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Counsellor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Specialization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {displayCounsellors.map((c, index) => (
                <tr key={c._id || c.id || index} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D9D9]/20 to-[#00D9D9]/5 flex items-center justify-center border border-[#00D9D9]/20">
                        <span className="text-[#00D9D9] font-semibold text-sm">
                          {c.name?.charAt(0).toUpperCase() || 'C'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{c.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{c.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{c.department || 'Mental Health'}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{c.specialization || 'General Counselling'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      c.isActive !== false 
                        ? 'bg-green-900/30 text-green-400 border border-green-800' 
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}>
                      {c.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setViewingCounsellor(c)}
                        className="text-[#00D9D9] hover:text-[#00C0C0] text-sm font-medium transition-colors"
                      >
                        View
                      </button>
                      <span className="text-gray-700">|</span>
                      <button 
                        onClick={() => setEditingCounsellor(c)}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <span className="text-gray-700">|</span>
                      <button 
                        onClick={() => handleToggleStatus(c)}
                        className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
                      >
                        {c.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                      <span className="text-gray-700">|</span>
                      <button 
                        onClick={() => handleDelete(c)}
                        className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Counsellor Modal */}
      {editingCounsellor && (
        <EditCounsellorForm
          counsellor={editingCounsellor}
          onClose={() => setEditingCounsellor(null)}
          onSuccess={() => {
            setEditingCounsellor(null)
            onRefresh()
          }}
          callApi={callApi}
        />
      )}

      {/* View Counsellor Modal */}
      {viewingCounsellor && (
        <CounsellorDetailModal
          counsellor={viewingCounsellor}
          onClose={() => setViewingCounsellor(null)}
          callApi={callApi}
        />
      )}
    </div>
  )
}

// Individual Counsellor Row Component
const CounsellorRow = ({ counsellor, onRefresh, callApi }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const id = counsellor.id || counsellor._id

  const toggleStatus = async () => {
    try {
      const result = await callApi(`/api/v1/admin/counsellors/${id}/status`, 'PATCH', {
        isActive: counsellor.isActive === false ? true : false
      })
      if (result.success) onRefresh()
      else alert(result.error || 'Failed to update status')
    } catch (e) {
      alert(e.message || 'Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Deactivate counsellor "${counsellor.name}"? They will no longer receive new bookings.`)) return
    try {
      const result = await callApi(`/api/v1/admin/counsellors/${id}`, 'DELETE')
      if (result.success) onRefresh()
      else alert(result.error || 'Failed to deactivate')
    } catch (e) {
      alert(e.message || 'Failed to deactivate')
    }
  }

  return (
    <>
      <tr>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-gray-700">{counsellor.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{counsellor.name}</div>
              <div className="text-sm text-gray-500">{counsellor.email}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{counsellor.department || 'Not specified'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{counsellor.specialization || 'General Counselling'}</td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${counsellor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {counsellor.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
          <button type="button" onClick={() => setShowDetail(true)} className="text-teal-700 hover:text-teal-900">View</button>
          <button type="button" onClick={() => setIsEditing(true)} className="text-teal-700 hover:text-teal-900">Edit</button>
          <button type="button" onClick={toggleStatus} className={counsellor.isActive ? 'text-rose-600 hover:text-rose-900' : 'text-emerald-600 hover:text-emerald-900'}>
            {counsellor.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-900">Delete</button>
        </td>
      </tr>
      {isEditing && (
        <EditCounsellorForm
          counsellor={counsellor}
          onClose={() => setIsEditing(false)}
          onSuccess={() => { setIsEditing(false); onRefresh(); }}
          callApi={callApi}
        />
      )}
      {showDetail && (
        <CounsellorDetailModal
          counsellor={counsellor}
          onClose={() => setShowDetail(false)}
          callApi={callApi}
        />
      )}
    </>
  )
}

// Add Counsellor Form Component
const AddCounsellorForm = ({ onClose, onSuccess, callApi }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    departmentOther: '',
    specialization: '',
    specializationOther: '',
    experience: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Mental health departments
  const departments = [
    'Clinical Psychology',
    'Counseling Psychology',
    'Psychiatry',
    'Social Work',
    'Mental Health Counseling',
    'Marriage and Family Therapy',
    'School Psychology',
    'Rehabilitation Counseling',
    'Behavioral Health',
    'Other'
  ]

  // Mental health specializations
  const specializations = [
    'Anxiety Disorders',
    'Depression',
    'Trauma & PTSD',
    'Substance Abuse',
    'Eating Disorders',
    'Bipolar Disorder',
    'Schizophrenia',
    'OCD (Obsessive-Compulsive Disorder)',
    'Adolescent Mental Health',
    'Geriatric Mental Health',
    'Family Therapy',
    'Couples Counseling',
    'Grief & Loss',
    'Stress Management',
    'Career Counseling',
    'Academic Counseling',
    'Crisis Intervention',
    'Suicide Prevention',
    'Other'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      // Prepare data - use "Other" text if Other is selected
      const submitData = {
        ...formData,
        department: formData.department === 'Other' ? formData.departmentOther : formData.department,
        specialization: formData.specialization === 'Other' ? formData.specializationOther : formData.specialization
      }
      // Remove the "Other" fields before sending
      delete submitData.departmentOther
      delete submitData.specializationOther

      const result = await callApi('/api/v1/admin/counsellors', 'POST', submitData)
      if (result.success) onSuccess()
      else setError(result.error || result.message || 'Failed to create counsellor')
    } catch (err) {
      setError(err.message || 'Failed to create counsellor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Add New Counsellor</h3>
          <p className="text-sm text-gray-400 mt-1">Fill in the details to create a new counsellor account</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors"
              placeholder="Dr. John Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors"
              placeholder="john.smith@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Department
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value, departmentOther: ''})}
              className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors"
            >
              <option value="" className="bg-[#1A1A1A]">Select Department</option>
              {departments.map(dept => (
                <option key={dept} value={dept} className="bg-[#1A1A1A]">{dept}</option>
              ))}
            </select>
            {formData.department === 'Other' && (
              <input
                type="text"
                value={formData.departmentOther}
                onChange={(e) => setFormData({...formData, departmentOther: e.target.value})}
                className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors mt-2"
                placeholder="Enter department name"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Specialization
            </label>
            <select
              value={formData.specialization}
              onChange={(e) => setFormData({...formData, specialization: e.target.value, specializationOther: ''})}
              className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors"
            >
              <option value="" className="bg-[#1A1A1A]">Select Specialization</option>
              {specializations.map(spec => (
                <option key={spec} value={spec} className="bg-[#1A1A1A]">{spec}</option>
              ))}
            </select>
            {formData.specialization === 'Other' && (
              <input
                type="text"
                value={formData.specializationOther}
                onChange={(e) => setFormData({...formData, specializationOther: e.target.value})}
                className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors mt-2"
                placeholder="Enter specialization name"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Experience (Years)
            </label>
            <input
              type="number"
              min="0"
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
              className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors"
              placeholder="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isLoading} 
            className="px-6 py-2.5 bg-[#00D9D9] text-black rounded-lg hover:bg-[#00C0C0] disabled:opacity-50 font-medium transition-all flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Counsellor</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Edit Counsellor Form (modal)
const EditCounsellorForm = ({ counsellor, onClose, onSuccess, callApi }) => {
  const id = counsellor.id || counsellor._id
  const [formData, setFormData] = useState({
    name: counsellor.name || '',
    department: counsellor.department || '',
    departmentOther: '',
    specialization: counsellor.specialization || '',
    specializationOther: '',
    experience: counsellor.experience ?? '',
    isActive: counsellor.isActive !== false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Mental health departments
  const departments = [
    'Clinical Psychology',
    'Counseling Psychology',
    'Psychiatry',
    'Social Work',
    'Mental Health Counseling',
    'Marriage and Family Therapy',
    'School Psychology',
    'Rehabilitation Counseling',
    'Behavioral Health',
    'Other'
  ]

  // Mental health specializations
  const specializations = [
    'Anxiety Disorders',
    'Depression',
    'Trauma & PTSD',
    'Substance Abuse',
    'Eating Disorders',
    'Bipolar Disorder',
    'Schizophrenia',
    'OCD (Obsessive-Compulsive Disorder)',
    'Adolescent Mental Health',
    'Geriatric Mental Health',
    'Family Therapy',
    'Couples Counseling',
    'Grief & Loss',
    'Stress Management',
    'Career Counseling',
    'Academic Counseling',
    'Crisis Intervention',
    'Suicide Prevention',
    'Other'
  ]

  // Check if current value is in predefined list
  useState(() => {
    if (counsellor.department && !departments.includes(counsellor.department)) {
      setFormData(prev => ({...prev, department: 'Other', departmentOther: counsellor.department}))
    }
    if (counsellor.specialization && !specializations.includes(counsellor.specialization)) {
      setFormData(prev => ({...prev, specialization: 'Other', specializationOther: counsellor.specialization}))
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      // Prepare data - use "Other" text if Other is selected
      const submitData = {
        ...formData,
        department: formData.department === 'Other' ? formData.departmentOther : formData.department,
        specialization: formData.specialization === 'Other' ? formData.specializationOther : formData.specialization
      }
      // Remove the "Other" fields before sending
      delete submitData.departmentOther
      delete submitData.specializationOther

      const result = await callApi(`/api/v1/admin/counsellors/${id}`, 'PUT', submitData)
      if (result.success) onSuccess()
      else setError(result.error || result.message || 'Failed to update')
    } catch (err) {
      setError(err.message || 'Failed to update')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Edit Counsellor</h3>
              <p className="text-sm text-gray-400 mt-1">Update counsellor information</p>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Experience (Years)
                </label>
                <input 
                  type="number" 
                  min={0} 
                  value={formData.experience} 
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })} 
                  className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value, departmentOther: ''})}
                  className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors"
                >
                  <option value="" className="bg-[#1A1A1A]">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept} className="bg-[#1A1A1A]">{dept}</option>
                  ))}
                </select>
                {formData.department === 'Other' && (
                  <input
                    type="text"
                    value={formData.departmentOther}
                    onChange={(e) => setFormData({...formData, departmentOther: e.target.value})}
                    className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors mt-2"
                    placeholder="Enter department name"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Specialization
                </label>
                <select
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value, specializationOther: ''})}
                  className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors"
                >
                  <option value="" className="bg-[#1A1A1A]">Select Specialization</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec} className="bg-[#1A1A1A]">{spec}</option>
                  ))}
                </select>
                {formData.specialization === 'Other' && (
                  <input
                    type="text"
                    value={formData.specializationOther}
                    onChange={(e) => setFormData({...formData, specializationOther: e.target.value})}
                    className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors mt-2"
                    placeholder="Enter specialization name"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center bg-black/20 p-4 rounded-lg border border-gray-800">
              <input 
                type="checkbox" 
                id="edit-active" 
                checked={formData.isActive} 
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} 
                className="w-4 h-4 rounded border-gray-600 text-[#00D9D9] focus:ring-[#00D9D9] bg-black/30"
              />
              <label htmlFor="edit-active" className="ml-3 text-sm text-gray-300">
                Active (available for bookings)
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isLoading} 
                className="px-6 py-2.5 bg-[#00D9D9] text-black rounded-lg hover:bg-[#00C0C0] disabled:opacity-50 font-medium transition-all flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Counsellor detail modal: counsellor info + completed sessions (student name, level, description)
const CounsellorDetailModal = ({ counsellor, onClose, callApi }) => {
  const [detail, setDetail] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const id = counsellor.id || counsellor._id
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const [resC, resA] = await Promise.all([
          callApi(`/api/v1/admin/counsellors/${id}`, 'GET'),
          callApi(`/api/v1/appointments/admin/all?counsellorId=${id}&limit=100`, 'GET')
        ])
        if (!cancelled) {
          if (resC.success && resC.data) setDetail(resC.data?.data ?? resC.data)
          if (resA.success && resA.data) {
            const list = resA.data?.appointments ?? (Array.isArray(resA.data) ? resA.data : [])
            setAppointments(list)
          }
        }
      } catch (_) {}
      if (!cancelled) setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [counsellor.id, counsellor._id, callApi])

  const completed = appointments.filter(a => a.status === 'completed')
  const riskColors = { low: 'bg-green-100 text-green-800', medium: 'bg-yellow-100 text-yellow-800', high: 'bg-orange-100 text-orange-800', critical: 'bg-red-100 text-red-800' }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Counsellor: {counsellor.name}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-600 border-t-transparent" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <p><span className="text-gray-500">Email:</span> {counsellor.email}</p>
                <p><span className="text-gray-500">Department:</span> {counsellor.department || '—'}</p>
                <p><span className="text-gray-500">Specialization:</span> {counsellor.specialization || '—'}</p>
                <p><span className="text-gray-500">Status:</span> {counsellor.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">Completed sessions (with user names)</h3>
              {completed.length === 0 ? (
                <p className="text-gray-500">No completed sessions yet.</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {completed.map((apt) => (
                        <tr key={apt._id}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{apt.studentId?.name ?? '—'}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{apt.slotStart ? new Date(apt.slotStart).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-2">
                            {apt.sessionRiskLevel ? <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskColors[apt.sessionRiskLevel] || ''}`}>{apt.sessionRiskLevel}</span> : '—'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate" title={apt.sessionSummary}>{apt.sessionSummary || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Peer Approval Tab Component (No changes needed, already uses local state)
const PeerApprovalTab = () => {
  const [pendingPeers, setPendingPeers] = useState([
    {
      id: 1,
      name: 'Rahul Sharma',
      email: 'rahul.sharma@college.edu',
      college: 'Delhi Technical University',
      year: '3rd Year',
      specialization: 'Anxiety & Stress Management',
      experience: '2 years peer counseling',
      appliedDate: '2024-01-15',
      status: 'pending'
    },
    {
      id: 2,
      name: 'Priya Patel',
      email: 'priya.patel@college.edu',
      college: 'Mumbai University',
      year: '4th Year',
      specialization: 'Depression Support',
      experience: '1.5 years peer support',
      appliedDate: '2024-01-14',
      status: 'pending'
    },
    {
      id: 3,
      name: 'Arjun Singh',
      email: 'arjun.singh@college.edu',
      college: 'Bangalore Institute of Technology',
      year: '2nd Year',
      specialization: 'General Mental Health',
      experience: '6 months volunteer work',
      appliedDate: '2024-01-13',
      status: 'pending'
    }
  ])

  const handleApproval = (id, action) => {
    setPendingPeers(peers => 
      peers.map(peer => 
        peer.id === id ? { ...peer, status: action } : peer
      )
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Peer Student Approval</h2>
          <p className="text-gray-600">Review and approve peer counselor applications</p>
        </div>
        <div className="flex space-x-2">
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            {pendingPeers.filter(p => p.status === 'pending').length} Pending
          </span>
        </div>
      </div>

      {/* Pending Applications */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Pending Applications</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {pendingPeers.map((peer) => (
            <div key={peer.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-indigo-600">
                        {peer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{peer.name}</h4>
                      <p className="text-sm text-gray-500">{peer.email}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">College</p>
                      <p className="text-sm text-gray-900">{peer.college}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Year</p>
                      <p className="text-sm text-gray-900">{peer.year}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Specialization</p>
                      <p className="text-sm text-gray-900">{peer.specialization}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Experience</p>
                      <p className="text-sm text-gray-900">{peer.experience}</p>
                    </div>
                  </div>
                </div>
                
                {peer.status === 'pending' && (
                  <div className="flex space-x-3 ml-4">
                    <button
                      onClick={() => handleApproval(peer.id, 'rejected')}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 text-sm font-medium"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproval(peer.id, 'approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                    >
                      Approve
                    </button>
                  </div>
                )}
                
                {peer.status === 'approved' && (
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Approved
                  </span>
                )}
                
                {peer.status === 'rejected' && (
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Rejected
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Student Analytics Tab Component (No changes needed, already uses local state)
const StudentAnalyticsTab = () => {
  const [analyticsData] = useState({
    overview: {
      totalStudents: 2847,
      activeStudents: 1923,
      newRegistrations: 156,
      engagementRate: 78.5
    },
    mentalHealthLevels: [
      { level: 'Excellent', count: 852, percentage: 30, color: 'bg-green-500' },
      { level: 'Good', count: 1138, percentage: 40, color: 'bg-orange-500' },
      { level: 'Fair', count: 569, percentage: 20, color: 'bg-red-400' },
      { level: 'Poor', count: 284, percentage: 10, color: 'bg-red-600' }
    ],
    courseEngagement: [
      { course: 'Stress Management', enrolled: 456, completed: 324, completion: 71 },
      { course: 'Mindfulness Basics', enrolled: 389, completed: 298, completion: 77 },
      { course: 'Anxiety Coping', enrolled: 234, completed: 167, completion: 71 },
      { course: 'Study Skills', enrolled: 345, completed: 289, completion: 84 }
    ],
    peerTalkStats: {
      totalSessions: 1247,
      activePeers: 23,
      avgSessionDuration: 45,
      satisfactionRate: 92
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Student Analytics</h2>
          <p className="text-gray-400 mt-1">Comprehensive insights into student engagement and mental health</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-800">
              <span className="text-sm font-bold text-blue-400">TU</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-white">{analyticsData.overview.totalStudents.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-900/30 border border-green-800">
              <span className="text-sm font-bold text-green-400">AS</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Active Students</p>
              <p className="text-2xl font-bold text-white">{analyticsData.overview.activeStudents.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-900/30 border border-purple-800">
              <span className="text-sm font-bold text-purple-400">NR</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">New This Month</p>
              <p className="text-2xl font-bold text-white">{analyticsData.overview.newRegistrations}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-900/30 border border-yellow-800">
              <span className="text-sm font-bold text-yellow-400">ER</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Engagement Rate</p>
              <p className="text-2xl font-bold text-white">{analyticsData.overview.engagementRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mental Health Levels Distribution */}
      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Mental Health Levels Distribution</h3>
        <div className="space-y-4">
          {analyticsData.mentalHealthLevels.map((level, index) => (
            <div key={index} className="flex items-center">
              <div className="w-24 text-sm font-medium text-gray-300">{level.level}</div>
              <div className="flex-1 mx-4">
                <div className="bg-gray-800 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full ${level.color} transition-all duration-500`}
                    style={{ width: `${level.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-28 text-sm text-gray-400 text-right">
                {level.count} ({level.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Course Engagement */}
      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800 bg-black/30">
          <h3 className="text-lg font-semibold text-white">Course Engagement</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-black/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Enrolled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {analyticsData.courseEngagement.map((course, index) => (
                <tr key={index} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{course.course}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{course.enrolled}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{course.completed}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-800 rounded-full h-2 mr-3">
                        <div 
                          className="bg-[#00D9D9] h-2 rounded-full transition-all duration-500" 
                          style={{width: `${course.completion}%`}}
                        ></div>
                      </div>
                      <span className="text-sm text-white w-12">{course.completion}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Peer Talk Statistics */}
      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Peer Talk Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 rounded-lg bg-black/30 border border-gray-800">
            <p className="text-3xl font-bold text-[#00D9D9]">{analyticsData.peerTalkStats.totalSessions}</p>
            <p className="text-sm text-gray-400 mt-1">Total Sessions</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-black/30 border border-gray-800">
            <p className="text-3xl font-bold text-green-400">{analyticsData.peerTalkStats.activePeers}</p>
            <p className="text-sm text-gray-400 mt-1">Active Peers</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-black/30 border border-gray-800">
            <p className="text-3xl font-bold text-purple-400">{analyticsData.peerTalkStats.avgSessionDuration}m</p>
            <p className="text-sm text-gray-400 mt-1">Avg Session Duration</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-black/30 border border-gray-800">
            <p className="text-3xl font-bold text-orange-400">{analyticsData.peerTalkStats.satisfactionRate}%</p>
            <p className="text-sm text-gray-400 mt-1">Satisfaction Rate</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Crisis Management Tab Component (No changes needed, already uses local state)
const CrisisManagementTab = () => {
  const [crisisAlerts] = useState([
    {
      id: 1,
      studentId: 'ST2024001',
      studentName: 'Anonymous User #1',
      alertType: 'High PHQ-9 Score',
      severity: 'Critical',
      score: 24,
      timestamp: '2024-01-15T14:30:00Z',
      status: 'Active',
      assignedTo: 'Dr. Sarah Johnson',
      notes: 'Student scored 24/27 on PHQ-9. Immediate intervention required.'
    },
    {
      id: 2,
      studentId: 'ST2024002', 
      studentName: 'Anonymous User #2',
      alertType: 'Self-harm Keywords',
      severity: 'Critical',
      score: null,
      timestamp: '2024-01-15T13:45:00Z',
      status: 'In Progress',
      assignedTo: 'Dr. Mike Wilson',
      notes: 'Chat session contained concerning self-harm keywords.'
    },
    {
      id: 3,
      studentId: 'ST2024003',
      studentName: 'Anonymous User #3',
      alertType: 'Emotional Distress',
      severity: 'High',
      score: 18,
      timestamp: '2024-01-15T12:20:00Z',
      status: 'Resolved',
      assignedTo: 'Dr. Emily Chen',
      notes: 'Student expressed severe emotional distress during counseling session.'
    }
  ])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-red-100 text-red-800'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800'
      case 'Resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[#2A3F47]">Crisis Management</h2>
          <p className="text-gray-600">Monitor and manage critical mental health alerts</p>
        </div>
        <div className="flex space-x-2">
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            {crisisAlerts.filter(a => a.status === 'Active').length} Active Alerts
          </span>
        </div>
      </div>

      {/* Crisis Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <span className="text-sm font-bold text-red-700">AA</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-red-600">
                {crisisAlerts.filter(a => a.status === 'Active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <span className="text-sm font-bold text-yellow-700">IP</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {crisisAlerts.filter(a => a.status === 'In Progress').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-green-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-sm font-bold text-green-700">RT</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved Today</p>
              <p className="text-2xl font-bold text-green-600">
                {crisisAlerts.filter(a => a.status === 'Resolved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-sm font-bold text-blue-700">AR</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-blue-600">8m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Crisis Alerts Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Crisis Alerts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alert Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {crisisAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{alert.studentName}</div>
                      <div className="text-sm text-gray-500">{alert.studentId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alert.alertType}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {alert.score ? `${alert.score}/27` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{alert.assignedTo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                    <button className="text-green-600 hover:text-green-900">Resolve</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contacts & Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Crisis Helpline</h4>
            <p className="text-2xl font-bold text-red-600">1-800-CRISIS</p>
            <p className="text-sm text-gray-600">24/7 Emergency Support</p>
          </div>
          <div className="p-4 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Campus Counseling</h4>
            <p className="text-2xl font-bold text-blue-600">1-800-CAMPUS</p>
            <p className="text-sm text-gray-600">Mon-Fri 8AM-8PM</p>
          </div>
          <div className="p-4 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Mental Health Services</h4>
            <p className="text-2xl font-bold text-green-600">1-800-MENTAL</p>
            <p className="text-sm text-gray-600">Professional Support</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Reports tab — live data from /api/v1/admin/reports/export
const ReportsTab = ({ callApi }) => {
  const [selectedReportType, setSelectedReportType] = useState('mental-health')
  const [dateRange, setDateRange] = useState('last-30-days')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [reportRows, setReportRows] = useState([])
  const [crisisBundle, setCrisisBundle] = useState(null)
  const [loadedApiType, setLoadedApiType] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [reportError, setReportError] = useState('')
  const [filterTool, setFilterTool] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [searchText, setSearchText] = useState('')

  const reportTypes = [
    { id: 'mental-health', name: 'Screenings (PHQ-9 / GAD-7)', apiType: 'screenings', hint: 'Scores & triage (no raw answers)' },
    { id: 'crisis', name: 'Crisis intervention', apiType: 'crisis', hint: 'High-risk screenings + flagged forum posts' },
    { id: 'appointments', name: 'Appointments', apiType: 'appointments', hint: 'Bookings in date range' },
    { id: 'forum', name: 'Forum (metadata)', apiType: 'forum', hint: 'Titles & status (body excluded)' },
    { id: 'users', name: 'Users', apiType: 'users', hint: 'Registrations in range' },
    { id: 'chatbot', name: 'Buddy / chatbot', apiType: null, hint: 'Use the Risk Dashboard tab for live Buddy metrics' },
  ]

  const reportPeriodMap = {
    'last-7-days': 7,
    'last-30-days': 30,
    'last-90-days': 90,
    'last-year': 365,
  }

  const selectedMeta = reportTypes.find((t) => t.id === selectedReportType)

  const buildQueryString = (apiType) => {
    const params = new URLSearchParams()
    params.set('type', apiType)
    params.set('format', 'json')
    if (dateRange === 'custom' && customStart && customEnd) {
      params.set('startDate', new Date(customStart).toISOString())
      params.set('endDate', new Date(customEnd).toISOString())
    } else {
      params.set('period', String(reportPeriodMap[dateRange] || 30))
    }
    return params.toString()
  }

  const generateReport = async () => {
    const apiType = selectedMeta?.apiType
    if (!apiType) {
      setReportError(null)
      setReportRows([])
      setCrisisBundle(null)
      setLoadedApiType(null)
      return
    }
    if (dateRange === 'custom' && (!customStart || !customEnd)) {
      setReportError('Please choose both start and end dates for a custom range.')
      return
    }
    setIsLoading(true)
    setReportError('')
    setReportRows([])
    setCrisisBundle(null)
    setLoadedApiType(null)
    try {
      const qs = buildQueryString(apiType)
      const result = await callApi(`/api/v1/admin/reports/export?${qs}`, 'GET')
      if (!result.success) {
        setReportError(result.error || 'Failed to generate report')
        return
      }
      const payload = result.data
      if (apiType === 'crisis' && payload && typeof payload === 'object' && !Array.isArray(payload) && payload.crisisScreenings) {
        setCrisisBundle(payload)
        setLoadedApiType('crisis')
      } else if (Array.isArray(payload)) {
        setReportRows(payload)
        setLoadedApiType(apiType)
      } else {
        setReportRows([])
        setReportError('Unexpected report shape from server.')
      }
    } catch (err) {
      setReportError(err.message || 'Failed to generate report')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredScreenings = reportRows.filter((row) => {
    if (loadedApiType !== 'screenings') return true
    if (filterTool !== 'all' && row.tool !== filterTool) return false
    if (filterSeverity !== 'all' && (row.severity || '') !== filterSeverity) return false
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      const name = (row.studentId?.name || '').toLowerCase()
      const email = (row.studentId?.email || '').toLowerCase()
      if (!name.includes(q) && !email.includes(q)) return false
    }
    return true
  })

  const filteredGeneric = reportRows.filter((row) => {
    if (!searchText.trim()) return true
    const q = searchText.toLowerCase()
    return JSON.stringify(row).toLowerCase().includes(q)
  })

  const rowsForTable = loadedApiType === 'screenings' ? filteredScreenings : filteredGeneric

  const hasCrisisData = crisisBundle && (crisisBundle.crisisScreenings?.length || crisisBundle.crisisForumPosts?.length)

  const exportReport = (format) => {
    if (format !== 'csv') return
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    let csvRows = []
    if (loadedApiType === 'crisis' && crisisBundle) {
      csvRows = [
        ['Section', 'Student', 'Detail', 'Created'],
        ...(crisisBundle.crisisScreenings || []).map((row) => [
          'Screening',
          row.studentId?.name || 'Anonymous',
          `${row.tool} score ${row.score} ${row.severity}`,
          row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
        ]),
        ...(crisisBundle.crisisForumPosts || []).map((row) => [
          'Forum',
          row.studentId?.name || 'Anonymous',
          row.title || row.status || '',
          row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
        ]),
      ]
    } else if (loadedApiType === 'screenings') {
      csvRows = [
        ['Student', 'Email', 'Tool', 'Score', 'Severity', 'Triage', 'Created'],
        ...rowsForTable.map((row) => [
          row.studentId?.name || 'Anonymous',
          row.studentId?.email || '',
          row.tool || '',
          row.score ?? '',
          row.severity || '',
          row.triageAction || '',
          row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
        ]),
      ]
    } else if (loadedApiType === 'appointments') {
      csvRows = [
        ['Student', 'Counsellor', 'Status', 'Slot start'],
        ...rowsForTable.map((row) => [
          row.studentId?.name || '',
          row.counsellorId?.name || '',
          row.status || '',
          row.slotStart ? new Date(row.slotStart).toLocaleString() : '',
        ]),
      ]
    } else if (loadedApiType === 'forum') {
      csvRows = [
        ['Student', 'Title', 'Status', 'Created'],
        ...rowsForTable.map((row) => [
          row.studentId?.name || 'Anonymous',
          row.title || '',
          row.status || '',
          row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
        ]),
      ]
    } else if (loadedApiType === 'users') {
      csvRows = [
        ['Name', 'Email', 'Role', 'Created'],
        ...rowsForTable.map((row) => [
          row.name || '',
          row.email || '',
          row.role || '',
          row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
        ]),
      ]
    }
    if (!csvRows.length) return
    const csvContent = csvRows.map((r) => r.map(esc).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `report-${loadedApiType || 'export'}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const canExportCsv = loadedApiType && (rowsForTable.length > 0 || hasCrisisData)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
          <p className="text-gray-400 mt-1">Pull live data from the server (admin only).</p>
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Report type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedReportType(type.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedReportType === type.id
                  ? 'border-[#00D9D9] bg-[#00D9D9]/10'
                  : 'border-gray-700 hover:border-gray-600 bg-black/30'
              }`}
            >
              <span className="font-semibold text-white block">{type.name}</span>
              <span className="text-xs text-gray-400 mt-1 block">{type.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Date range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-black/30 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#00D9D9]"
              >
                <option value="last-7-days">Last 7 days</option>
                <option value="last-30-days">Last 30 days</option>
                <option value="last-90-days">Last 90 days</option>
                <option value="last-year">Last year</option>
                <option value="custom">Custom (ISO dates)</option>
              </select>
            </div>
            {dateRange === 'custom' && (
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-black/30 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00D9D9]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-black/30 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00D9D9]"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={generateReport}
              disabled={!selectedMeta?.apiType || isLoading}
              className="bg-[#00D9D9] text-black px-5 py-2.5 rounded-lg hover:bg-[#00C0C0] font-medium disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Loading…' : 'Generate report'}
            </button>
            <button
              type="button"
              disabled
              title="PDF export not implemented on server yet"
              className="bg-gray-700 text-gray-500 px-4 py-2 rounded-lg font-medium cursor-not-allowed"
            >
              Export PDF (soon)
            </button>
            <button
              type="button"
              onClick={() => exportReport('csv')}
              disabled={!canExportCsv}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-medium disabled:opacity-50 transition-all"
            >
              Export CSV
            </button>
          </div>
        </div>

        {loadedApiType === 'screenings' && reportRows.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-800">
            <input
              type="search"
              placeholder="Search student name or email…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-black/30 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:border-[#00D9D9]"
            />
            <select
              value={filterTool}
              onChange={(e) => setFilterTool(e.target.value)}
              className="bg-black/30 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00D9D9]"
            >
              <option value="all">All tools</option>
              <option value="PHQ-9">PHQ-9</option>
              <option value="GAD-7">GAD-7</option>
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-black/30 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00D9D9]"
            >
              <option value="all">All severity</option>
              {['Minimal', 'Mild', 'Moderate', 'Moderately severe', 'Severe'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {loadedApiType && loadedApiType !== 'screenings' && loadedApiType !== 'crisis' && reportRows.length > 0 && (
          <div className="pt-2 border-t border-gray-800">
            <input
              type="search"
              placeholder="Filter rows (any field)…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-black/30 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm w-full max-w-md focus:outline-none focus:border-[#00D9D9]"
            />
          </div>
        )}
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800">
        <div className="p-6 border-b border-gray-800 bg-black/30">
          <h3 className="text-lg font-semibold text-white">Preview</h3>
          <p className="text-sm text-gray-400 mt-1">
            {selectedMeta?.name || 'Report'} — {dateRange === 'custom' ? `${customStart || '…'} → ${customEnd || '…'}` : dateRange.replace(/-/g, ' ')}
          </p>
        </div>

        <div className="p-6">
          {!selectedMeta?.apiType && (
            <div className="text-center py-8 text-gray-400">
              Select a report with API support and click <strong className="text-white">Generate report</strong>. For Buddy chatbot analytics, open the <strong className="text-white">Risk Dashboard</strong> tab.
            </div>
          )}
          {selectedMeta?.apiType && isLoading && (
            <div className="text-center py-8 text-gray-400">Generating report…</div>
          )}
          {reportError && (
            <div className="bg-red-900/20 text-red-400 border border-red-700 rounded-lg p-4">{reportError}</div>
          )}
          {!isLoading && !reportError && selectedMeta?.apiType && loadedApiType === 'crisis' && crisisBundle && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
                  <p className="text-xs text-red-400 font-medium uppercase">High-risk screenings</p>
                  <p className="text-2xl font-bold text-red-300">{crisisBundle.summary?.totalCrisisScreenings ?? 0}</p>
                </div>
                <div className="bg-orange-900/20 border border-orange-800 rounded-xl p-4">
                  <p className="text-xs text-orange-400 font-medium uppercase">Forum flags (self-harm)</p>
                  <p className="text-2xl font-bold text-orange-300">{crisisBundle.summary?.totalCrisisForumPosts ?? 0}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-medium uppercase">Total crisis rows</p>
                  <p className="text-2xl font-bold text-gray-200">{crisisBundle.summary?.totalCrisisAlerts ?? 0}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Screenings</h4>
                <div className="overflow-x-auto border border-gray-800 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-800 text-sm">
                    <thead className="bg-black/30">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Student</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Tool</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Score</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Severity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {(crisisBundle.crisisScreenings || []).length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">None in this range</td></tr>
                      ) : (
                        crisisBundle.crisisScreenings.map((row) => (
                          <tr key={row._id} className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-2 text-gray-300">{row.studentId?.name || 'Anonymous'}</td>
                            <td className="px-4 py-2 text-gray-300">{row.tool}</td>
                            <td className="px-4 py-2 text-gray-300">{row.score}</td>
                            <td className="px-4 py-2 text-gray-300">{row.severity}</td>
                            <td className="px-4 py-2 text-gray-400">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Forum posts (flagged)</h4>
                <div className="overflow-x-auto border border-gray-800 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-800 text-sm">
                    <thead className="bg-black/30">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Student</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Title</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {(crisisBundle.crisisForumPosts || []).length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">None in this range</td></tr>
                      ) : (
                        crisisBundle.crisisForumPosts.map((row) => (
                          <tr key={row._id} className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-2 text-gray-300">{row.studentId?.name || 'Anonymous'}</td>
                            <td className="px-4 py-2 max-w-xs truncate text-gray-300" title={row.title}>{row.title}</td>
                            <td className="px-4 py-2 text-gray-300">{row.status}</td>
                            <td className="px-4 py-2 text-gray-400">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !reportError && loadedApiType === 'screenings' && (
            rowsForTable.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {reportRows.length === 0 ? 'No rows in this range. Generate again after new screenings.' : 'No rows match filters.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tool</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Triage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {rowsForTable.map((row, index) => (
                      <tr key={row._id || index} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-4 text-sm font-medium text-white">{row.studentId?.name || 'Anonymous'}</td>
                        <td className="px-4 py-4 text-sm text-gray-400">{row.tool}</td>
                        <td className="px-4 py-4 text-sm text-gray-400">{row.score}</td>
                        <td className="px-4 py-4 text-sm text-gray-400">{row.severity}</td>
                        <td className="px-4 py-4 text-sm text-gray-400">{row.triageAction}</td>
                        <td className="px-4 py-4 text-sm text-gray-400">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {!isLoading && !reportError && loadedApiType === 'appointments' && (
            rowsForTable.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No appointments in this range.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800 text-sm">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Counsellor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Slot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {rowsForTable.map((row) => (
                      <tr key={row._id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-gray-300">{row.studentId?.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{row.counsellorId?.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{row.status}</td>
                        <td className="px-4 py-3 text-gray-400">{row.slotStart ? new Date(row.slotStart).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {!isLoading && !reportError && loadedApiType === 'forum' && (
            rowsForTable.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No forum rows in this range.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800 text-sm">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {rowsForTable.map((row) => (
                      <tr key={row._id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-gray-300">{row.studentId?.name || 'Anonymous'}</td>
                        <td className="px-4 py-3 max-w-md truncate text-gray-300" title={row.title}>{row.title}</td>
                        <td className="px-4 py-3 text-gray-300">{row.status}</td>
                        <td className="px-4 py-3 text-gray-400">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {!isLoading && !reportError && loadedApiType === 'users' && (
            rowsForTable.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No users in this range.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800 text-sm">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {rowsForTable.map((row) => (
                      <tr key={row._id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-gray-300">{row.name}</td>
                        <td className="px-4 py-3 text-gray-300">{row.email}</td>
                        <td className="px-4 py-3 text-gray-300">{row.role}</td>
                        <td className="px-4 py-3 text-gray-400">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// Course Management Tab Component (No changes needed, already uses local state)
const CourseManagementTab = () => {
  const [showAddCourseForm, setShowAddCourseForm] = useState(false)
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: 'Stress Management Techniques',
      description: 'Learn effective methods to manage and reduce stress in academic and personal life.',
      language: 'English',
      duration: '4 weeks',
      level: 'Beginner',
      enrolled: 456,
      status: 'Active'
    },
    {
      id: 2,
      title: 'मानसिक स्वास्थ्य और योग',
      description: 'योग और ध्यान के माध्यम से मानसिक स्वास्थ्य में सुधार करें।',
      language: 'Hindi',
      duration: '3 weeks',
      level: 'Intermediate',
      enrolled: 234,
      status: 'Active'
    },
    {
      id: 3,
      title: 'Mindfulness and Meditation',
      description: 'Introduction to mindfulness practices and meditation techniques.',
      language: 'English',
      duration: '2 weeks',
      level: 'Beginner',
      enrolled: 389,
      status: 'Active'
    }
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[#2A3F47]">Course Management</h2>
          <p className="text-gray-600">Add and manage mental health courses and resources</p>
        </div>
        <button
          onClick={() => setShowAddCourseForm(true)}
          className="bg-teal-800 text-white px-5 py-2.5 rounded-xl hover:bg-teal-900 font-medium text-sm transition-all shadow-md"
        >
          + Add New Course
        </button>
      </div>

      {/* Add Course Form Modal */}
      {showAddCourseForm && (
        <AddCourseForm 
          onClose={() => setShowAddCourseForm(false)}
          onSave={(courseData) => {
            setCourses([...courses, { ...courseData, id: courses.length + 1, enrolled: 0, status: 'Active' }])
            setShowAddCourseForm(false)
          }}
        />
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                course.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {course.status}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Language:</span>
                <span className="font-medium">{course.language}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration:</span>
                <span className="font-medium">{course.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Level:</span>
                <span className="font-medium">{course.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Enrolled:</span>
                <span className="font-medium text-blue-600">{course.enrolled} students</span>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button className="flex-1 bg-teal-800 text-white py-2 px-4 rounded-xl hover:bg-teal-900 text-sm font-medium">
                Edit Course
              </button>
              <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-xl hover:bg-gray-200 text-sm font-medium">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Add Course Form Component (No changes needed, already uses local state)
const AddCourseForm = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'English',
    duration: '',
    level: 'Beginner',
    category: 'Mental Health',
    tags: '',
    resources: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Add New Course</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
                placeholder="e.g., Stress Management Techniques"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
                placeholder="Describe what students will learn in this course..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language *
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिन्दी (Hindi)</option>
                  <option value="Bengali">বাংলা (Bengali)</option>
                  <option value="Tamil">தமிழ் (Tamil)</option>
                  <option value="Telugu">తెలుగు (Telugu)</option>
                  <option value="Marathi">मराठी (Marathi)</option>
                  <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                  <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                  <option value="Malayalam">മലയാളം (Malayalam)</option>
                  <option value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration *
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="">Select Duration</option>
                  <option value="1 week">1 Week</option>
                  <option value="2 weeks">2 Weeks</option>
                  <option value="3 weeks">3 Weeks</option>
                  <option value="4 weeks">4 Weeks</option>
                  <option value="6 weeks">6 Weeks</option>
                  <option value="8 weeks">8 Weeks</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="Mental Health">Mental Health</option>
                  <option value="Stress Management">Stress Management</option>
                  <option value="Mindfulness">Mindfulness & Meditation</option>
                  <option value="Anxiety">Anxiety Management</option>
                  <option value="Depression">Depression Support</option>
                  <option value="Study Skills">Study Skills</option>
                  <option value="Life Skills">Life Skills</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
                placeholder="e.g., stress, anxiety, mindfulness, wellness"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Resources
              </label>
              <textarea
                rows={3}
                value={formData.resources}
                onChange={(e) => setFormData({...formData, resources: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
                placeholder="Links to videos, PDFs, articles, or other helpful resources..."
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-teal-800 text-white rounded-xl hover:bg-teal-900 font-medium"
              >
                Add Course
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Settings Tab Component - Admin Profile Settings
const SettingsTab = ({ adminUser, adminName, adminEmail, callApi }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: adminName,
    email: adminEmail,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [message, setMessage] = useState(null)

  const handleSaveProfile = async () => {
    try {
      const result = await callApi('/api/v1/auth/profile', 'PUT', {
        name: formData.name,
        email: formData.email
      })
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setIsEditing(false)
        // Update localStorage
        const updatedUser = { ...adminUser, name: formData.name, email: formData.email }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    }
  }

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    try {
      const result = await callApi('/api/v1/auth/change-password', 'POST', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
      if (result.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' })
        setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to change password' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Account Settings</h2>
        <p className="text-gray-400 mt-1">Manage your admin account information and security</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-900/20 border-green-700 text-green-400' 
            : 'bg-red-900/20 border-red-700 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 bg-black/30 flex items-center justify-between">
          <h3 className="font-semibold text-white">Profile Information</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-[#00D9D9]/10 text-[#00D9D9] rounded-lg hover:bg-[#00D9D9]/20 text-sm font-medium transition-colors border border-[#00D9D9]/30"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              className="w-full bg-[#0A0A0A] border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
              className="w-full bg-[#0A0A0A] border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
            <input
              type="text"
              value="Administrator"
              disabled
              className="w-full bg-[#0A0A0A] border border-gray-700 text-gray-500 rounded-lg px-4 py-3 cursor-not-allowed"
            />
          </div>
          {isEditing && (
            <div className="pt-4">
              <button
                onClick={handleSaveProfile}
                className="px-6 py-2.5 bg-[#00D9D9] text-black rounded-lg hover:bg-[#00C0C0] font-medium transition-all"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 bg-black/30">
          <h3 className="font-semibold text-white">Change Password</h3>
          <p className="text-sm text-gray-400 mt-1">Update your password to keep your account secure</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="w-full bg-[#0A0A0A] border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full bg-[#0A0A0A] border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-[#0A0A0A] border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00D9D9] transition-colors"
              placeholder="Confirm new password"
            />
          </div>
          <div className="pt-4">
            <button
              onClick={handleChangePassword}
              disabled={!formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
              className="px-6 py-2.5 bg-[#00D9D9] text-black rounded-lg hover:bg-[#00C0C0] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 bg-black/30">
          <h3 className="font-semibold text-white">System Information</h3>
        </div>
        <div className="p-6 space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-gray-400">User ID</span>
            <span className="text-white font-mono">{adminUser?._id || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-gray-400">Account Created</span>
            <span className="text-white">{adminUser?.createdAt ? new Date(adminUser.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400">Last Login</span>
            <span className="text-white">{new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardNew