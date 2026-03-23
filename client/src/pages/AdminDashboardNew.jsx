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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1A3438] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img 
                  src={logoImage} 
                  alt="Mann-Mitra Logo" 
                  className="h-14 w-auto brightness-0 invert"
                />
              </button>
              <div className="border-l border-white/20 pl-4">
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-teal-200 text-sm">Manage your Mann-Mitra platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-teal-200 hover:text-white transition-colors px-3 py-2"
              >
                View Site
              </button>
              <button className="bg-teal-600 text-white px-5 py-2.5 rounded-xl hover:bg-teal-500 font-medium text-sm transition-all shadow-lg hover:shadow-xl">
                Generate Report
              </button>
              <button
                onClick={() => {
                  clearStoredAuth()
                  navigate('/admin/login')
                }}
                className="text-sm text-teal-200 hover:text-white transition-colors px-3 py-2 border border-teal-300/50 rounded-lg hover:bg-white/10"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 font-medium text-sm whitespace-nowrap rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-teal-50 text-teal-800 border-b-2 border-teal-800'
                    : 'text-gray-500 hover:text-teal-800 hover:bg-gray-50'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Removed Rate Limit Notification */}
      {/* Rate Limit Notification UI removed */}

      {/* Error Notification */}
      {apiError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{apiError}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setApiError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
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
        </div>
      )}

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        {activeTab === 'peer-approval' && <PeerApprovalTab />}
        {activeTab === 'students' && <StudentAnalyticsTab />}
        {activeTab === 'crisis' && <CrisisManagementTab />}
        {activeTab === 'reports' && <ReportsTab callApi={callApi} />}
        {activeTab === 'courses' && <CourseManagementTab />}
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
    low: { bg: 'bg-green-100', text: 'text-green-800', bar: 'bg-green-500' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', bar: 'bg-yellow-500' },
    high: { bg: 'bg-orange-100', text: 'text-orange-800', bar: 'bg-orange-500' },
    critical: { bg: 'bg-red-100', text: 'text-red-800', bar: 'bg-red-500' },
  }

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-800 mx-auto"></div><p className="mt-4 text-gray-500">Loading risk data...</p></div>
  if (error) return <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"><p className="text-red-700 font-medium">{error}</p><button onClick={fetchRiskDashboard} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button></div>

  const dist = dashboardData?.severity_distribution || {}
  const totalSessions = Object.values(dist).reduce((sum, d) => sum + (d.count || 0), 0) || 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Risk Monitoring Dashboard</h2>
        <button onClick={fetchRiskDashboard} className="px-4 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 text-sm">Refresh</button>
      </div>

      {/* Severity Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['critical', 'high', 'medium', 'low'].map(level => {
          const d = dist[level] || { count: 0, avg_score: 0 }
          const colors = riskColors[level]
          return (
            <div key={level} className={`${colors.bg} rounded-xl p-5 border`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold uppercase ${colors.text}`}>{level}</span>
                <span className={`text-3xl font-bold ${colors.text}`}>{d.count}</span>
              </div>
              <p className={`text-xs mt-1 ${colors.text} opacity-70`}>Avg Score: {d.avg_score || 0}/100</p>
              <div className="mt-2 w-full bg-white/50 rounded-full h-2">
                <div className={`${colors.bar} h-2 rounded-full`} style={{ width: `${Math.min((d.count / totalSessions) * 100, 100)}%` }}></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* High Risk Active Cases */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">High-Risk Active Cases</h3>
          <p className="text-sm text-gray-500">Sessions flagged as high or critical risk (anonymized)</p>
        </div>
        <div className="divide-y divide-gray-100">
          {(!dashboardData?.high_risk_cases || dashboardData.high_risk_cases.length === 0) ? (
            <div className="px-6 py-8 text-center text-gray-400">No high-risk cases at this time</div>
          ) : (
            dashboardData.high_risk_cases.map((c, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${c.risk_level === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`}>
                    {c.risk_score}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {c.display_name || c.user_name || c.anonymous_id}
                      {c.user_name && <span className="ml-2 text-xs text-gray-400 font-normal">({c.anonymous_id})</span>}
                    </p>
                    <p className="text-sm text-gray-500 max-w-md truncate">{c.risk_summary}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${riskColors[c.risk_level]?.bg} ${riskColors[c.risk_level]?.text}`}>
                    {c.risk_level}
                  </span>
                  <span className="text-xs text-gray-400">{c.interaction_count} msgs</span>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Recent Risk Alerts</h3>
        </div>
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {(!dashboardData?.recent_alerts || dashboardData.recent_alerts.length === 0) ? (
            <div className="px-6 py-8 text-center text-gray-400">No recent alerts</div>
          ) : (
            dashboardData.recent_alerts.map((a, i) => (
              <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <span className={`w-2 h-2 rounded-full ${riskColors[a.risk_level]?.bar}`}></span>
                  <span className="text-sm text-gray-700 max-w-lg truncate">{a.risk_summary}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${riskColors[a.risk_level]?.bg} ${riskColors[a.risk_level]?.text}`}>
                    {a.risk_score}/100
                  </span>
                  <span className="text-xs text-gray-400">
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

// Overview Tab Component
const OverviewTab = ({ data }) => {
  if (!data) return <div>Loading...</div>

  const stats = [
    { label: 'Total Users', value: data.overview?.totalUsers || 0, change: '+12%', accent: 'bg-teal-500' },
    { label: 'Active Counsellors', value: data.overview?.activeCounsellors || 0, change: '+5%', accent: 'bg-amber-500' },
    { label: 'Appointments Today', value: data.overview?.todayAppointments || 0, change: '+8%', accent: 'bg-sky-500' },
    { label: 'Crisis Alerts', value: data.overview?.crisisAlerts || 0, change: '-2%', accent: 'bg-rose-500' }
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className={`h-1.5 w-full ${stat.accent}`}></div>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-[#2A3F47]">{stat.value.toLocaleString()}</p>
              <p className={`text-sm mt-2 font-medium ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.change} from last month
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[#2A3F47]">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center space-x-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0"></div>
                <p className="text-sm text-gray-600">Sample activity item {item}</p>
                <p className="text-xs text-gray-400 ml-auto whitespace-nowrap">{item} min ago</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Counsellor Management Tab Component
const CounsellorManagementTab = ({ counsellors, onRefresh, showAddForm, setShowAddForm, callApi }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Counsellor Management</h2>
          <p className="text-gray-600">Add, edit, and manage counsellor accounts</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-teal-800 text-white px-5 py-2.5 rounded-xl hover:bg-teal-900 font-medium text-sm transition-all shadow-md hover:shadow-lg"
        >
          + Add Counsellor
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

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[#2A3F47]">Current Counsellors</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counsellor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {counsellors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No counsellors yet. Add one to get started.
                  </td>
                </tr>
              ) : (
                counsellors.map((c) => (
                  <CounsellorRow key={c.id || c._id} counsellor={c} onRefresh={onRefresh} callApi={callApi} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
      const result = await callApi(`/api/v1/admin/counsellors/${id}/status`, 'PATCH', { isActive: !counsellor.isActive })
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
    specialization: '',
    experience: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const result = await callApi('/api/v1/admin/counsellors', 'POST', formData)
      if (result.success) onSuccess()
      else setError(result.error || result.message || 'Failed to create counsellor')
    } catch (err) {
      setError(err.message || 'Failed to create counsellor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Counsellor</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience (Years)
              </label>
              <input
                type="number"
                min="0"
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-4 py-2 bg-teal-800 text-white rounded-xl hover:bg-teal-900 disabled:opacity-50 font-medium">
                {isLoading ? 'Creating...' : 'Create Counsellor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Edit Counsellor Form (modal)
const EditCounsellorForm = ({ counsellor, onClose, onSuccess, callApi }) => {
  const id = counsellor.id || counsellor._id
  const [formData, setFormData] = useState({
    name: counsellor.name || '',
    department: counsellor.department || '',
    specialization: counsellor.specialization || '',
    experience: counsellor.experience ?? '',
    isActive: counsellor.isActive !== false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const result = await callApi(`/api/v1/admin/counsellors/${id}`, 'PUT', formData)
      if (result.success) onSuccess()
      else setError(result.error || result.message || 'Failed to update')
    } catch (err) {
      setError(err.message || 'Failed to update')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Edit Counsellor</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          {error && <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4"><p className="text-red-700 text-sm">{error}</p></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input type="text" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
              <input type="number" min={0} value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700" />
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="edit-active" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded border-gray-300 text-teal-800 focus:ring-teal-700" />
              <label htmlFor="edit-active" className="ml-2 text-sm text-gray-700">Active (available for bookings)</label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-4 py-2 bg-teal-800 text-white rounded-xl hover:bg-teal-900 disabled:opacity-50 font-medium">{isLoading ? 'Saving...' : 'Save'}</button>
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
      { level: 'Excellent', count: 852, percentage: 30, color: '#10B981' },
      { level: 'Good', count: 1138, percentage: 40, color: '#F59E0B' },
      { level: 'Fair', count: 569, percentage: 20, color: '#EF4444' },
      { level: 'Poor', count: 284, percentage: 10, color: '#DC2626' }
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
          <h2 className="text-xl font-semibold text-gray-900">Student Analytics</h2>
          <p className="text-gray-600">Comprehensive insights into student engagement and mental health</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-sm font-bold text-blue-700">TU</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalStudents.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-sm font-bold text-green-700">AS</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.activeStudents.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="text-sm font-bold text-purple-700">NR</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.newRegistrations}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <span className="text-sm font-bold text-yellow-700">ER</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.engagementRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mental Health Levels Distribution */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Mental Health Levels Distribution</h3>
        <div className="space-y-4">
          {analyticsData.mentalHealthLevels.map((level, index) => (
            <div key={index} className="flex items-center">
              <div className="w-24 text-sm font-medium text-gray-700">{level.level}</div>
              <div className="flex-1 mx-4">
                <div className="bg-gray-200 rounded-full h-4">
                  <div 
                    className="h-4 rounded-full" 
                    style={{ width: `${level.percentage}%`, backgroundColor: level.color }}
                  ></div>
                </div>
              </div>
              <div className="w-20 text-sm text-gray-600 text-right">
                {level.count} ({level.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Course Engagement */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Course Engagement</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.courseEngagement.map((course, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.course}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.enrolled}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.completed}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{width: `${course.completion}%`}}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{course.completion}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Peer Talk Statistics */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Peer Talk Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{analyticsData.peerTalkStats.totalSessions}</p>
            <p className="text-sm text-gray-600">Total Sessions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{analyticsData.peerTalkStats.activePeers}</p>
            <p className="text-sm text-gray-600">Active Peers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{analyticsData.peerTalkStats.avgSessionDuration}m</p>
            <p className="text-sm text-gray-600">Avg Session Duration</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{analyticsData.peerTalkStats.satisfactionRate}%</p>
            <p className="text-sm text-gray-600">Satisfaction Rate</p>
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
          <h2 className="text-xl font-semibold text-[#2A3F47]">Reports & Analytics</h2>
          <p className="text-gray-600">Pull live data from the server (admin only).</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedReportType(type.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedReportType === type.id
                  ? 'border-teal-700 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="font-medium text-gray-900 block">{type.name}</span>
              <span className="text-xs text-gray-500 mt-1 block">{type.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-700"
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
                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
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
              className="bg-teal-800 text-white px-4 py-2 rounded-xl hover:bg-teal-900 font-medium disabled:opacity-50"
            >
              {isLoading ? 'Loading…' : 'Generate report'}
            </button>
            <button
              type="button"
              disabled
              title="PDF export not implemented on server yet"
              className="bg-gray-200 text-gray-500 px-4 py-2 rounded-xl font-medium cursor-not-allowed"
            >
              Export PDF (soon)
            </button>
            <button
              type="button"
              onClick={() => exportReport('csv')}
              disabled={!canExportCsv}
              className="bg-gray-700 text-white px-4 py-2 rounded-xl hover:bg-gray-800 font-medium disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        {loadedApiType === 'screenings' && reportRows.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
            <input
              type="search"
              placeholder="Search student name or email…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm flex-1 min-w-[200px]"
            />
            <select
              value={filterTool}
              onChange={(e) => setFilterTool(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
            >
              <option value="all">All tools</option>
              <option value="PHQ-9">PHQ-9</option>
              <option value="GAD-7">GAD-7</option>
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
            >
              <option value="all">All severity</option>
              {['Minimal', 'Mild', 'Moderate', 'Moderately severe', 'Severe'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {loadedApiType && loadedApiType !== 'screenings' && loadedApiType !== 'crisis' && reportRows.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <input
              type="search"
              placeholder="Filter rows (any field)…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-full max-w-md"
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Preview</h3>
          <p className="text-sm text-gray-600 mt-1">
            {selectedMeta?.name || 'Report'} — {dateRange === 'custom' ? `${customStart || '…'} → ${customEnd || '…'}` : dateRange.replace(/-/g, ' ')}
          </p>
        </div>

        <div className="p-6">
          {!selectedMeta?.apiType && (
            <div className="text-center py-8 text-gray-500">
              Select a report with API support and click <strong>Generate report</strong>. For Buddy chatbot analytics, open the <strong>Risk Dashboard</strong> tab.
            </div>
          )}
          {selectedMeta?.apiType && isLoading && (
            <div className="text-center py-8 text-gray-500">Generating report…</div>
          )}
          {reportError && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">{reportError}</div>
          )}
          {!isLoading && !reportError && selectedMeta?.apiType && loadedApiType === 'crisis' && crisisBundle && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                  <p className="text-xs text-rose-600 font-medium uppercase">High-risk screenings</p>
                  <p className="text-2xl font-bold text-rose-800">{crisisBundle.summary?.totalCrisisScreenings ?? 0}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs text-amber-700 font-medium uppercase">Forum flags (self-harm)</p>
                  <p className="text-2xl font-bold text-amber-900">{crisisBundle.summary?.totalCrisisForumPosts ?? 0}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase">Total crisis rows</p>
                  <p className="text-2xl font-bold text-gray-800">{crisisBundle.summary?.totalCrisisAlerts ?? 0}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Screenings</h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tool</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(crisisBundle.crisisScreenings || []).length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">None in this range</td></tr>
                      ) : (
                        crisisBundle.crisisScreenings.map((row) => (
                          <tr key={row._id}>
                            <td className="px-4 py-2">{row.studentId?.name || 'Anonymous'}</td>
                            <td className="px-4 py-2">{row.tool}</td>
                            <td className="px-4 py-2">{row.score}</td>
                            <td className="px-4 py-2">{row.severity}</td>
                            <td className="px-4 py-2">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Forum posts (flagged)</h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(crisisBundle.crisisForumPosts || []).length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">None in this range</td></tr>
                      ) : (
                        crisisBundle.crisisForumPosts.map((row) => (
                          <tr key={row._id}>
                            <td className="px-4 py-2">{row.studentId?.name || 'Anonymous'}</td>
                            <td className="px-4 py-2 max-w-xs truncate" title={row.title}>{row.title}</td>
                            <td className="px-4 py-2">{row.status}</td>
                            <td className="px-4 py-2">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
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
              <div className="text-center py-8 text-gray-500">
                {reportRows.length === 0 ? 'No rows in this range. Generate again after new screenings.' : 'No rows match filters.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tool</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rowsForTable.map((row, index) => (
                      <tr key={row._id || index}>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{row.studentId?.name || 'Anonymous'}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{row.tool}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{row.score}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{row.severity}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{row.triageAction}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {!isLoading && !reportError && loadedApiType === 'appointments' && (
            rowsForTable.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No appointments in this range.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Counsellor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rowsForTable.map((row) => (
                      <tr key={row._id}>
                        <td className="px-4 py-3">{row.studentId?.name || '—'}</td>
                        <td className="px-4 py-3">{row.counsellorId?.name || '—'}</td>
                        <td className="px-4 py-3">{row.status}</td>
                        <td className="px-4 py-3">{row.slotStart ? new Date(row.slotStart).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {!isLoading && !reportError && loadedApiType === 'forum' && (
            rowsForTable.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No forum rows in this range.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rowsForTable.map((row) => (
                      <tr key={row._id}>
                        <td className="px-4 py-3">{row.studentId?.name || 'Anonymous'}</td>
                        <td className="px-4 py-3 max-w-md truncate" title={row.title}>{row.title}</td>
                        <td className="px-4 py-3">{row.status}</td>
                        <td className="px-4 py-3">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {!isLoading && !reportError && loadedApiType === 'users' && (
            rowsForTable.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No users in this range.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rowsForTable.map((row) => (
                      <tr key={row._id}>
                        <td className="px-4 py-3">{row.name}</td>
                        <td className="px-4 py-3">{row.email}</td>
                        <td className="px-4 py-3">{row.role}</td>
                        <td className="px-4 py-3">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
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

export default AdminDashboardNew