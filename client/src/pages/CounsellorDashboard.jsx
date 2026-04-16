import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import logoImage from '../assets/Mann-mitra.png'
import { useApi } from '../hooks/useApi'
import { clearStoredAuth } from '../utils/routeAuth'

const CounsellorDashboard = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [appointments, setAppointments] = useState([])
  const [availability, setAvailability] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('Mann-Mitra_token')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      if (parsedUser.role !== 'counsellor') {
        console.warn('User is not a counsellor:', parsedUser.role)
      }
    }
    if (!token) console.error('No authentication token found!')
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('Mann-Mitra_token')
      const userData = localStorage.getItem('user')
      if (!token || !userData) { navigate('/counsellor/login'); return }
      const u = JSON.parse(userData)
      if (u.role !== 'counsellor') { navigate('/counsellor/login'); return }
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'appointments', name: 'Appointments' },
    { id: 'certification', name: 'Certification' },
    { id: 'availability', name: 'Availability' },
    { id: 'reports', name: 'Reports' },
    { id: 'profile', name: 'Profile' }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F7F4' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-800"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
      {/* Header */}
      <div className="bg-[#1A3438] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/')} className="cursor-pointer hover:opacity-80 transition-opacity">
                <img src={logoImage} alt="Mann-Mitra Logo" className="h-14 w-auto" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Counsellor Dashboard</h1>
                <p className="text-teal-200 text-sm">Welcome back, {user?.name || 'Counsellor'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user?.specialization && (
                <span className="bg-white/10 text-teal-100 px-3 py-1 rounded-full text-sm">
                  {user.specialization}
                </span>
              )}
              <button
                onClick={() => { clearStoredAuth(); navigate('/counsellor/login') }}
                className="text-sm font-medium text-teal-200 hover:text-white px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-[#1A3438]/90 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-5 font-medium text-sm rounded-t-xl transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#F9F7F4] text-teal-800'
                    : 'text-teal-200 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'appointments' && <AppointmentsTab />}
        {activeTab === 'certification' && <CertificationTab />}
        {activeTab === 'availability' && <AvailabilityTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'profile' && <ProfileTab user={user} />}
      </div>
    </div>
  )
}

// Dashboard Overview Tab
const DashboardTab = () => {
  const { callApi } = useApi()
  const [dashboardData, setDashboardData] = useState({
    appointments: [], stats: { today: 0, thisWeek: 0, pending: 0, completed: 0 }, loading: true
  })

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await callApi('/api/v1/appointments/me', 'GET')
      if (response.success) {
        const serverResponse = response.data || response
        const appointments = serverResponse.appointments || []
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay())
        const todayAppointments = appointments.filter(apt => { const d = new Date(apt.slotStart); return d >= startOfDay && d < endOfDay })
        const weeklyAppointments = appointments.filter(apt => new Date(apt.slotStart) >= startOfWeek)
        const pendingAppointments = appointments.filter(apt => apt.status === 'requested' || apt.status === 'pending')
        const completedAppointments = appointments.filter(apt => apt.status === 'completed')
        setDashboardData({
          appointments: todayAppointments,
          stats: { today: todayAppointments.length, thisWeek: weeklyAppointments.length, pending: pendingAppointments.length, completed: completedAppointments.length },
          loading: false
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setDashboardData(prev => ({ ...prev, loading: false }))
    }
  }

  const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const getModeLabel = (mode) => { switch (mode?.toLowerCase()) { case 'video': return 'Video Call'; case 'tele': case 'chat': return 'Online Session'; case 'in-person': return 'In-Person'; default: return 'Session' } }

  const stats = [
    { label: "Today's Appointments", value: dashboardData.stats.today, sub: dashboardData.stats.today > 0 ? 'Schedule active' : 'No appointments today', accent: 'bg-teal-500' },
    { label: "This Week's Sessions", value: dashboardData.stats.thisWeek, sub: `${dashboardData.stats.completed} completed`, accent: 'bg-amber-500' },
    { label: 'Pending Requests', value: dashboardData.stats.pending, sub: 'Need your response', accent: 'bg-sky-500' },
    { label: 'Completed Sessions', value: dashboardData.stats.completed, sub: 'This month', accent: 'bg-violet-500' }
  ]

  if (dashboardData.loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-800"></div>
        <span className="ml-2 text-gray-500">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
            <div className={`h-1.5 w-full ${stat.accent}`}></div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-[#2A3F47]">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="h-1.5 w-full bg-teal-500"></div>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#2A3F47]">Today's Schedule ({dashboardData.appointments.length} appointments)</h3>
          <button onClick={fetchDashboardData} className="text-sm text-teal-800 hover:text-teal-900 font-medium">Refresh</button>
        </div>
        <div className="p-6">
          {dashboardData.appointments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h4 className="text-lg font-medium text-[#2A3F47] mb-2">No appointments today</h4>
              <p className="text-gray-400">You have a free day! Check back tomorrow.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.appointments.sort((a, b) => new Date(a.slotStart) - new Date(b.slotStart)).map((appointment) => (
                <div key={appointment._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-[#2A3F47]">{formatTime(appointment.slotStart)} – {formatTime(appointment.slotEnd)}</div>
                    <div>
                      <p className="text-sm font-medium text-[#2A3F47]">{appointment.studentId?.name || 'Anonymous Student'}</p>
                      <p className="text-xs text-gray-400">
                        {getModeLabel(appointment.mode)}
                        {appointment.urgency && (
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${appointment.urgency === 'high' ? 'bg-rose-50 text-rose-700' : appointment.urgency === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{appointment.urgency}</span>
                        )}
                      </p>
                      {appointment.reason && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">Reason: {appointment.reason}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                      appointment.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                      appointment.status === 'confirmed' ? 'bg-sky-50 text-sky-700' :
                      appointment.status === 'requested' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        appointment.status === 'completed' ? 'bg-emerald-500' :
                        appointment.status === 'confirmed' ? 'bg-sky-500' :
                        appointment.status === 'requested' ? 'bg-amber-500' :
                        'bg-gray-400'
                      }`}></span>
                      {appointment.status === 'completed' && 'Completed'}
                      {appointment.status === 'confirmed' && 'Confirmed'}
                      {appointment.status === 'requested' && 'Pending'}
                      {!['completed', 'confirmed', 'requested'].includes(appointment.status) && appointment.status}
                    </span>
                    {appointment.status === 'confirmed' && <span className="text-xs text-teal-800 font-medium">Ready to join</span>}
                    {appointment.status === 'requested' && <span className="text-xs text-amber-600 font-medium">Awaiting response</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Appointments Management Tab
const AppointmentsTab = () => {
  const navigate = useNavigate()
  const { callApi } = useApi()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [completeSessionAppointment, setCompleteSessionAppointment] = useState(null)
  const [completeForm, setCompleteForm] = useState({ sessionRiskLevel: 'low', sessionSummary: '' })

  useEffect(() => { fetchAppointments() }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true); setError(null)
      const response = await callApi('/api/v1/appointments/me', 'GET')
      if (response.success) {
        const serverResponse = response.data || response
        setAppointments(serverResponse.appointments || [])
      } else { setError('Failed to load appointments') }
    } catch (err) {
      console.error('Error fetching counsellor appointments:', err)
      setError('Failed to load appointments')
    } finally { setLoading(false) }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-emerald-50 text-emerald-700'
      case 'pending': case 'requested': return 'bg-amber-50 text-amber-700'
      case 'completed': return 'bg-sky-50 text-sky-700'
      case 'cancelled': return 'bg-rose-50 text-rose-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getModeLabel = (mode) => { switch (mode?.toLowerCase()) { case 'video': return 'Video Call'; case 'tele': case 'chat': return 'Online Session'; case 'in-person': return 'In-Person'; default: return 'Session' } }
  const formatDate = (ds) => new Date(ds).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const formatTime = (ds) => new Date(ds).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  const handleConfirmAppointment = async (appointmentId) => {
    try {
      const response = await callApi(`/api/v1/appointments/${appointmentId}/status`, 'PATCH', { status: 'confirmed' })
      if (response.success) { fetchAppointments(); alert('Appointment confirmed successfully!') }
    } catch (error) { console.error('Error confirming appointment:', error); alert('Failed to confirm appointment') }
  }

  const handleCancelAppointment = async (appointmentId) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const response = await callApi(`/api/v1/appointments/${appointmentId}/status`, 'PATCH', { status: 'cancelled', cancellationReason: 'Cancelled by counsellor' })
        if (response.success) { fetchAppointments(); alert('Appointment cancelled successfully!') }
      } catch (error) { console.error('Error cancelling appointment:', error); alert('Failed to cancel appointment') }
    }
  }

  const handleJoinSession = (appointment) => {
    try {
      if (appointment.mode === 'video' || appointment.mode === 'tele' || appointment.mode === 'chat') {
        const studentId = appointment.studentId?._id || appointment.studentId
        navigate(`/chat-platform?appointment=${appointment._id}&user=${studentId}`)
      } else { alert('Please prepare for the in-person session at the scheduled time and location.') }
    } catch (error) { console.error('Error in joinSession:', error); alert('Unable to join session. Please try again.') }
  }

  const handleOpenCompleteForm = (appointment) => {
    setCompleteSessionAppointment(appointment)
    setCompleteForm({ sessionRiskLevel: 'low', sessionSummary: '' })
  }

  const handleSubmitCompleteSession = async () => {
    if (!completeSessionAppointment) return
    const id = completeSessionAppointment._id || completeSessionAppointment.id
    try {
      const response = await callApi(`/api/v1/appointments/${id}/status`, 'PATCH', {
        status: 'completed', sessionRiskLevel: completeForm.sessionRiskLevel, sessionSummary: completeForm.sessionSummary.trim() || undefined
      })
      if (response.success) { setCompleteSessionAppointment(null); fetchAppointments(); alert('Session marked complete and report saved.') }
      else { alert(response.error || 'Failed to complete session') }
    } catch (err) { alert(err.message || 'Failed to complete session') }
  }

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true
    const status = appointment.status?.toLowerCase()
    if (filter === 'pending') return status === 'pending' || status === 'requested'
    return status === filter.toLowerCase()
  })

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-800"></div>
        <span className="ml-2 text-gray-500">Loading appointments...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-rose-600 mb-4">{error}</p>
        <button onClick={fetchAppointments} className="px-4 py-2 bg-teal-800 text-white rounded-xl hover:bg-teal-900">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[#2A3F47]">Appointment Management</h2>
          <p className="text-gray-500 text-sm">View and manage your student appointments ({appointments.length} total)</p>
        </div>
        <button onClick={fetchAppointments} className="px-4 py-2 bg-teal-800 text-white rounded-xl hover:bg-teal-900 transition-colors text-sm font-medium">Refresh</button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              filter === key ? 'bg-teal-800 text-white shadow-lg' : 'bg-white text-[#2A3F47] border border-gray-200 hover:border-teal-800 shadow-sm'
            }`}
          >
            {label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {key === 'all' ? appointments.length : appointments.filter(apt => {
                const s = apt.status?.toLowerCase()
                if (key === 'pending') return s === 'pending' || s === 'requested'
                return s === key
              }).length}
            </span>
          </button>
        ))}
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="text-lg font-medium text-[#2A3F47] mb-2">No appointments found</h3>
          <p className="text-gray-500">{filter === 'all' ? "No student appointments scheduled yet." : `No ${filter} appointments found.`}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="h-1.5 w-full bg-teal-500"></div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  {['Date & Time', 'Student', 'Type', 'Status', 'Reason', 'Priority', 'Actions'].map((h, i) => (
                    <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment._id || appointment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-medium text-[#2A3F47]">{formatDate(appointment.slotStart)}</div>
                      <div className="text-gray-400">{formatTime(appointment.slotStart)} – {formatTime(appointment.slotEnd)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-[#2A3F47]">{appointment.studentId?.name || 'Anonymous Student'}</div>
                      <div className="text-gray-400 text-xs">{appointment.studentId?.email}</div>
                      <div className="text-gray-400 text-xs">ID: {appointment.studentId?.collegeId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2A3F47]">{getModeLabel(appointment.mode)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      <div className="truncate" title={appointment.reason}>{appointment.reason || 'No reason provided'}</div>
                      {appointment.privateNotes && <div className="text-xs text-teal-700 mt-1">Private notes available</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {appointment.urgency && (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.urgency === 'high' ? 'bg-rose-50 text-rose-700' :
                          appointment.urgency === 'medium' ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${appointment.urgency === 'high' ? 'bg-rose-500' : appointment.urgency === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                          {appointment.urgency}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-1">
                        {appointment.status === 'requested' && (
                          <div className="flex gap-1">
                            <button onClick={() => handleConfirmAppointment(appointment._id || appointment.id)} className="text-teal-800 hover:bg-teal-50 text-xs px-2.5 py-1.5 border border-teal-200 rounded-lg transition-colors">Confirm</button>
                            <button onClick={() => handleCancelAppointment(appointment._id || appointment.id)} className="text-rose-600 hover:bg-rose-50 text-xs px-2.5 py-1.5 border border-rose-200 rounded-lg transition-colors">Decline</button>
                          </div>
                        )}
                        {appointment.status === 'confirmed' && (
                          <div className="flex flex-wrap gap-1">
                            <button onClick={() => handleJoinSession(appointment)} className="text-teal-800 hover:bg-teal-50 text-xs px-2.5 py-1.5 border border-teal-200 rounded-lg transition-colors">
                              {appointment.mode === 'video' && 'Video'}
                              {(appointment.mode === 'tele' || appointment.mode === 'chat') && 'Chat/Online'}
                              {appointment.mode === 'in-person' && 'Prepare'}
                            </button>
                            <button onClick={() => handleOpenCompleteForm(appointment)} className="text-emerald-700 hover:bg-emerald-50 text-xs px-2.5 py-1.5 border border-emerald-200 rounded-lg transition-colors">Finish</button>
                            <button onClick={() => handleCancelAppointment(appointment._id || appointment.id)} className="text-rose-600 hover:bg-rose-50 text-xs px-2.5 py-1.5 border border-rose-200 rounded-lg transition-colors">Cancel</button>
                          </div>
                        )}
                        {appointment.status === 'completed' && (appointment.sessionRiskLevel || appointment.sessionSummary) && (
                          <span className="text-xs text-gray-400" title={appointment.sessionSummary || ''}>{appointment.sessionRiskLevel || '—'} • Report saved</span>
                        )}
                        {(appointment.status === 'cancelled' || appointment.status === 'pending') && <span className="text-gray-400 text-xs">No actions</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complete Session modal */}
      {completeSessionAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="h-1.5 w-full bg-teal-500"></div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-[#2A3F47] mb-2">Complete Session</h3>
              <p className="text-sm text-gray-500 mb-4">
                Student: <strong>{completeSessionAppointment.studentId?.name || '—'}</strong>. Add a risk level and summary.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session risk level</label>
                  <select value={completeForm.sessionRiskLevel} onChange={(e) => setCompleteForm({ ...completeForm, sessionRiskLevel: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:border-teal-700">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description / summary</label>
                  <textarea value={completeForm.sessionSummary} onChange={(e) => setCompleteForm({ ...completeForm, sessionSummary: e.target.value })} placeholder="Brief notes about the session..." rows={4} maxLength={2000} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:border-teal-700" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setCompleteSessionAppointment(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="button" onClick={handleSubmitCompleteSession} className="px-4 py-2 bg-teal-800 text-white rounded-xl hover:bg-teal-900">Complete & save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Availability Management Tab
const AvailabilityTab = () => {
  const [weeklySchedule, setWeeklySchedule] = useState({
    monday: [{ start: '09:00', end: '17:00', isActive: true }],
    tuesday: [{ start: '09:00', end: '17:00', isActive: true }],
    wednesday: [{ start: '09:00', end: '17:00', isActive: true }],
    thursday: [{ start: '09:00', end: '17:00', isActive: true }],
    friday: [{ start: '09:00', end: '17:00', isActive: true }],
    saturday: [],
    sunday: []
  })
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#2A3F47]">Availability Schedule</h2>
        <p className="text-gray-500 text-sm">Set your weekly availability for student appointments</p>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="h-1.5 w-full bg-teal-500"></div>
        <div className="p-6">
          <h3 className="text-lg font-medium text-[#2A3F47] mb-4">Weekly Schedule</h3>
          <div className="space-y-3">
            {days.map((day) => (
              <div key={day} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-colors">
                <div className="w-24">
                  <label className="block text-sm font-medium text-[#2A3F47] capitalize">{day}</label>
                </div>
                <div className="flex-1">
                  {weeklySchedule[day].length === 0 ? (
                    <span className="text-gray-400 italic text-sm">Not available</span>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {weeklySchedule[day].map((slot, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input type="time" value={slot.start} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-teal-700 focus:border-teal-700" />
                          <span className="text-gray-400 text-sm">to</span>
                          <input type="time" value={slot.end} className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-teal-700 focus:border-teal-700" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button className="text-teal-800 hover:text-teal-900 text-sm font-medium">Add Slot</button>
                  {weeklySchedule[day].length > 0 && <button className="text-rose-600 hover:text-rose-700 text-sm font-medium">Remove</button>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button className="bg-teal-800 text-white px-5 py-2.5 rounded-xl hover:bg-teal-900 font-medium text-sm">Save Schedule</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Session Reports Tab
const ReportsTab = () => {
  const { callApi } = useApi()
  const [completed, setCompleted] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const res = await callApi('/api/v1/appointments/me?includeCompleted=true', 'GET')
        if (!cancelled && res.success && res.data) {
          const list = res.data?.appointments ?? (Array.isArray(res.data) ? res.data : [])
          setCompleted(list.filter(a => a.status === 'completed').sort((a, b) => new Date(b.slotStart) - new Date(a.slotStart)))
        }
      } catch (_) {}
      if (!cancelled) setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [callApi])

  const riskColors = { low: 'bg-emerald-50 text-emerald-700', medium: 'bg-amber-50 text-amber-700', high: 'bg-orange-50 text-orange-700', critical: 'bg-rose-50 text-rose-700' }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#2A3F47]">Session Reports</h2>
        <p className="text-gray-500 text-sm">Completed sessions with risk level and description.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="h-1.5 w-full bg-teal-500"></div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-800 border-t-transparent" /></div>
        ) : completed.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No completed sessions yet. Finish a session from the Appointments tab.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                {['Student', 'Date', 'Level', 'Summary'].map((h, i) => (
                  <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {completed.map((apt) => (
                <tr key={apt._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-[#2A3F47]">{apt.studentId?.name ?? '—'}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{apt.slotStart ? new Date(apt.slotStart).toLocaleString() : '—'}</td>
                  <td className="px-6 py-3">
                    {apt.sessionRiskLevel ? <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${riskColors[apt.sessionRiskLevel] || ''}`}>{apt.sessionRiskLevel}</span> : '—'}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500 max-w-md">{apt.sessionSummary || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// Profile Tab
const ProfileTab = ({ user }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#2A3F47]">Profile Settings</h2>
        <p className="text-gray-500 text-sm">Manage your counsellor profile information</p>
      </div>
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="h-1.5 w-full bg-teal-500"></div>
        <div className="p-6">
          <h3 className="text-lg font-medium text-[#2A3F47] mb-4">Personal Information</h3>
          <div className="space-y-4">
            {[
              { label: 'Name', value: user?.name || '', type: 'text' },
              { label: 'Email', value: user?.email || '', type: 'email' },
              { label: 'Specialization', value: user?.specialization || 'General Counselling', type: 'text' }
            ].map((field, i) => (
              <div key={i}>
                <label className="block text-sm font-medium text-gray-500 mb-1">{field.label}</label>
                <input type={field.type} value={field.value} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-teal-700 focus:border-teal-700 bg-gray-50/50 text-[#2A3F47]" readOnly />
              </div>
            ))}
            <p className="text-sm text-gray-400 mt-4">To update your profile information, please contact your administrator.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Certification Interviews Tab
const CertificationTab = () => {
  const [interviews, setInterviews] = useState([])
  const [selectedInterview, setSelectedInterview] = useState(null)
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [evaluationData, setEvaluationData] = useState({ approved: null, notes: '', recommendations: '' })

  useEffect(() => {
    const storedInterviews = JSON.parse(localStorage.getItem('certificationInterviews') || '[]')
    if (storedInterviews.length === 0) {
      const demoInterviews = [
        { id: 1, studentId: 'user123', studentName: 'Anonymous Student #1234', counsellorId: '1', counsellorName: 'Dr. Sarah Johnson', date: '2025-09-30', time: '10:00', examScore: 87, status: 'scheduled', notes: 'Interested in peer support for anxiety and depression topics', createdAt: '2025-09-27T10:00:00.000Z' },
        { id: 2, studentId: 'user456', studentName: 'Anonymous Student #5678', counsellorId: '1', counsellorName: 'Dr. Sarah Johnson', date: '2025-09-28', time: '14:30', examScore: 92, status: 'completed', evaluation: { approved: true, notes: 'Excellent understanding of peer support principles.', recommendations: 'Recommended for certification approval.', evaluatedAt: '2025-09-27T14:30:00.000Z' }, createdAt: '2025-09-25T10:00:00.000Z' }
      ]
      localStorage.setItem('certificationInterviews', JSON.stringify(demoInterviews))
      setInterviews(demoInterviews)
    } else {
      setInterviews(storedInterviews)
    }
  }, [])

  const handleCompleteInterview = (interview) => { setSelectedInterview(interview); setShowEvaluationModal(true) }

  const handleSubmitEvaluation = () => {
    const updatedInterviews = interviews.map(interview => {
      if (interview.id === selectedInterview.id) {
        return { ...interview, status: 'completed', evaluation: { ...evaluationData, evaluatedAt: new Date().toISOString() } }
      }
      return interview
    })
    setInterviews(updatedInterviews)
    localStorage.setItem('certificationInterviews', JSON.stringify(updatedInterviews))
    if (evaluationData.approved) {
      const certificationQueue = JSON.parse(localStorage.getItem('certificationQueue') || '[]')
      certificationQueue.push({ id: Date.now(), studentId: selectedInterview.studentId, studentName: selectedInterview.studentName, examScore: selectedInterview.examScore, interviewDate: selectedInterview.date, counsellorName: selectedInterview.counsellorName, counsellorNotes: evaluationData.notes, status: 'pending_admin_approval', submittedAt: new Date().toISOString() })
      localStorage.setItem('certificationQueue', JSON.stringify(certificationQueue))
    }
    setShowEvaluationModal(false); setSelectedInterview(null); setEvaluationData({ approved: null, notes: '', recommendations: '' })
  }

  const formatDate = (ds) => new Date(ds).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const scheduledInterviews = interviews.filter(i => i.status === 'scheduled')
  const completedInterviews = interviews.filter(i => i.status === 'completed')

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="h-1.5 w-full bg-teal-500"></div>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-[#2A3F47] mb-2">Certification Interview Management</h2>
          <p className="text-gray-500 text-sm mb-6">Review and evaluate students who have completed peer support training.</p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Scheduled Interviews', value: scheduledInterviews.length, accent: 'bg-sky-500' },
              { label: 'Approved Students', value: completedInterviews.filter(i => i.evaluation?.approved).length, accent: 'bg-emerald-500' },
              { label: 'Need More Training', value: completedInterviews.filter(i => i.evaluation?.approved === false).length, accent: 'bg-rose-500' }
            ].map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-xl overflow-hidden">
                <div className={`h-1 w-full ${s.accent}`}></div>
                <div className="p-4">
                  <div className="text-2xl font-bold text-[#2A3F47]">{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Scheduled */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#2A3F47] mb-4">Scheduled Interviews</h3>
            {scheduledInterviews.length > 0 ? (
              <div className="space-y-3">
                {scheduledInterviews.map((interview) => (
                  <div key={interview.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-medium text-[#2A3F47]">{interview.studentName}</h4>
                            <p className="text-sm text-gray-500">{formatDate(interview.date)} at {interview.time}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium">Exam Score: {interview.examScore}%</span>
                        </div>
                        {interview.notes && <p className="text-sm text-gray-500 mt-2"><strong>Student Notes:</strong> {interview.notes}</p>}
                      </div>
                      <button onClick={() => handleCompleteInterview(interview)} className="px-4 py-2 bg-teal-800 text-white rounded-xl hover:bg-teal-900 transition-colors text-sm font-medium">Complete Interview</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-center py-8">No scheduled interviews</p>}
          </div>

          {/* Completed */}
          <div>
            <h3 className="text-lg font-semibold text-[#2A3F47] mb-4">Completed Interviews</h3>
            {completedInterviews.length > 0 ? (
              <div className="space-y-3">
                {completedInterviews.map((interview) => (
                  <div key={interview.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-[#2A3F47]">{interview.studentName}</h4>
                        <p className="text-sm text-gray-500">Interviewed on {formatDate(interview.date)} · Exam Score: {interview.examScore}%</p>
                      </div>
                      {interview.evaluation?.approved ? (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full font-medium">Approved for Certification</span>
                      ) : (
                        <span className="px-3 py-1 bg-rose-50 text-rose-700 text-sm rounded-full font-medium">Needs More Training</span>
                      )}
                    </div>
                    {interview.evaluation?.notes && (
                      <div className="bg-gray-50 rounded-xl p-3 mt-3">
                        <p className="text-sm text-gray-600"><strong>Evaluation Notes:</strong> {interview.evaluation.notes}</p>
                        {interview.evaluation.recommendations && <p className="text-sm text-gray-600 mt-2"><strong>Recommendations:</strong> {interview.evaluation.recommendations}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-center py-8">No completed interviews</p>}
          </div>
        </div>
      </div>

      {/* Evaluation Modal */}
      {showEvaluationModal && selectedInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto overflow-hidden shadow-xl">
            <div className="h-1.5 w-full bg-teal-500"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-[#2A3F47] mb-4">Interview Evaluation – {selectedInterview.studentName}</h3>

              <div className="space-y-4 mb-6">
                <div className="bg-[#F9E6D0]/50 rounded-xl p-4">
                  <h4 className="font-medium text-[#2A3F47] mb-2">Student Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500 font-medium">Exam Score:</span> <span className="text-[#2A3F47] ml-2">{selectedInterview.examScore}%</span></div>
                    <div><span className="text-gray-500 font-medium">Interview Date:</span> <span className="text-[#2A3F47] ml-2">{formatDate(selectedInterview.date)}</span></div>
                  </div>
                  {selectedInterview.notes && (
                    <div className="mt-2"><span className="text-gray-500 font-medium text-sm">Student Notes:</span><p className="text-[#2A3F47] text-sm mt-1">{selectedInterview.notes}</p></div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certification Recommendation *</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="radio" name="approved" checked={evaluationData.approved === true} onChange={() => setEvaluationData({...evaluationData, approved: true})} className="mr-2 accent-teal-800" />
                      <span className="text-emerald-700 font-medium">Approve for Certification</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="approved" checked={evaluationData.approved === false} onChange={() => setEvaluationData({...evaluationData, approved: false})} className="mr-2 accent-teal-800" />
                      <span className="text-rose-700 font-medium">Needs Additional Training</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Evaluation Notes *</label>
                  <textarea rows={4} value={evaluationData.notes} onChange={(e) => setEvaluationData({...evaluationData, notes: e.target.value})} placeholder="Provide detailed feedback..." className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations (Optional)</label>
                  <textarea rows={3} value={evaluationData.recommendations} onChange={(e) => setEvaluationData({...evaluationData, recommendations: e.target.value})} placeholder="Any specific recommendations..." className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700" />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleSubmitEvaluation} disabled={evaluationData.approved === null || !evaluationData.notes} className="flex-1 px-4 py-2.5 bg-teal-800 text-white rounded-xl hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium">Submit Evaluation</button>
                <button onClick={() => { setShowEvaluationModal(false); setSelectedInterview(null); setEvaluationData({ approved: null, notes: '', recommendations: '' }) }} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CounsellorDashboard