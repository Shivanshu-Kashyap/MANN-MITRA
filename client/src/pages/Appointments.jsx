import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'

const Appointments = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { callApi } = useApi()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await callApi('/api/v1/appointments/me', 'GET')

      if (response.success) {
        const serverResponse = response.data || response
        const appointmentsData = serverResponse.appointments || []
        setAppointments(appointmentsData)
      } else {
        setError('Failed to load appointments')
      }
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError('Failed to load appointments')
    } finally {
      setLoading(false)
    }
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

  const getStatusDot = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-emerald-500'
      case 'pending': case 'requested': return 'bg-amber-500'
      case 'completed': return 'bg-sky-500'
      case 'cancelled': return 'bg-rose-500'
      default: return 'bg-gray-400'
    }
  }

  const getModeLabel = (mode) => {
    switch (mode?.toLowerCase()) {
      case 'video': return 'Video Call'
      case 'chat': case 'tele': return 'Online Chat'
      case 'in-person': return 'In-Person Meeting'
      default: return 'Online Session'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }

  const filteredAppointments = (Array.isArray(appointments) ? appointments : []).filter(appointment => {
    if (filter === 'all') return true
    const status = appointment.status?.toLowerCase()
    if (filter === 'pending') return status === 'pending' || status === 'requested'
    return status === filter.toLowerCase()
  })

  const joinSession = (appointment) => {
    if (appointment.mode === 'video' || appointment.mode === 'chat' || appointment.mode === 'tele') {
      navigate(`/chat-platform?appointment=${appointment._id}&user=${appointment.counsellorId._id || appointment.counsellorId}`)
    } else {
      alert('Please visit the counseling center at the scheduled time')
    }
  }

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F7F4' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-800 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading appointments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F7F4' }}>
        <div className="bg-white rounded-2xl shadow-md overflow-hidden max-w-md w-full mx-4 text-center">
          <div className="h-1.5 w-full bg-rose-500"></div>
          <div className="p-8">
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#2A3F47] mb-2">{error}</h2>
            <p className="text-gray-500 mb-6">Please try again or contact support if the problem persists.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={fetchAppointments}
                className="px-4 py-2 bg-teal-800 text-white rounded-xl font-medium hover:bg-teal-900 transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/booking"
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Book New
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#F9F7F4' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-teal-800 mb-3">
            My Appointments
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Manage your counseling sessions and join upcoming appointments
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {filterTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                filter === key
                  ? 'bg-teal-800 text-white shadow-lg'
                  : 'bg-white text-[#2A3F47] border border-gray-200 hover:border-teal-800 hover:text-teal-800 shadow-sm'
              }`}
            >
              {label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {key === 'all'
                  ? appointments.length
                  : key === 'pending'
                    ? appointments.filter(apt => apt.status?.toLowerCase() === 'pending' || apt.status?.toLowerCase() === 'requested').length
                    : appointments.filter(apt => apt.status?.toLowerCase() === key).length
                }
              </span>
            </button>
          ))}
        </div>

        {/* Appointments Grid */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#2A3F47] mb-2">No appointments found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {filter === 'all'
                ? "You don't have any appointments yet. Book your first session to get started."
                : `No ${filter} appointments found. Try selecting a different filter.`
              }
            </p>
            <Link
              to="/booking"
              className="inline-flex items-center px-6 py-3 bg-teal-800 text-white font-medium rounded-xl hover:bg-teal-900 transition-colors"
            >
              Book New Appointment
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id || appointment._id}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                {/* Accent stripe */}
                <div className={`h-1.5 w-full ${getStatusDot(appointment.status)}`}></div>

                {/* Card Header */}
                <div className="p-6 border-b border-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 bg-[#F9E6D0] rounded-full flex items-center justify-center">
                        <span className="font-bold text-teal-800">
                          {appointment.counsellorId?.name?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#2A3F47]">
                          {appointment.counsellorId?.name || 'Counsellor'}
                        </h3>
                        <p className="text-xs text-gray-400">Mental Health Professional</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(appointment.status)}`}></span>
                      {appointment.status || 'Pending'}
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium text-[#2A3F47]">{formatDate(appointment.slotStart)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatTime(appointment.slotStart)} – {formatTime(appointment.slotEnd)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{getModeLabel(appointment.mode)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {appointment.reason && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 mb-1">Reason</p>
                      <p className="text-gray-600 text-sm">{appointment.reason}</p>
                    </div>
                  )}

                  {appointment.urgency && (
                    <div className="mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        appointment.urgency === 'high' ? 'bg-rose-50 text-rose-700' :
                        appointment.urgency === 'medium' ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          appointment.urgency === 'high' ? 'bg-rose-500' :
                          appointment.urgency === 'medium' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}></span>
                        {appointment.urgency} priority
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                      <button
                        onClick={() => joinSession(appointment)}
                        className="flex-1 px-4 py-2.5 bg-teal-800 text-white rounded-xl font-medium text-sm hover:bg-teal-900 transition-colors"
                      >
                        {appointment.mode === 'video' && 'Start Video Call'}
                        {(appointment.mode === 'chat' || appointment.mode === 'tele') && 'Start Chat'}
                        {appointment.mode === 'in-person' && 'View Details'}
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`/appointments/${appointment.id || appointment._id}`)}
                      className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Details
                    </button>

                    {appointment.status === 'pending' && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this appointment?')) {
                            alert('Cancellation feature will be implemented')
                          }
                        }}
                        className="px-4 py-2.5 text-rose-600 border border-rose-200 rounded-xl text-sm font-medium hover:bg-rose-50 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-10">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="h-1.5 w-full bg-teal-500"></div>
            <div className="p-6 text-center">
              <h3 className="text-lg font-semibold text-[#2A3F47] mb-5">Quick Actions</h3>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/booking"
                  className="px-5 py-2.5 bg-teal-800 text-white font-medium rounded-xl hover:bg-teal-900 transition-colors text-sm"
                >
                  Book New Appointment
                </Link>
                <button
                  onClick={() => {
                    const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed')
                    if (confirmedAppointments.length > 0) {
                      const appointment = confirmedAppointments[0]
                      const counsellorId = appointment.counsellorId?._id || appointment.counsellorId
                      navigate(`/chat-platform?appointment=${appointment._id}&user=${counsellorId}`)
                    } else {
                      alert('No confirmed appointments found. Please book an appointment first.')
                    }
                  }}
                  className="px-5 py-2.5 border-2 border-teal-800 text-teal-800 font-medium rounded-xl hover:bg-teal-800 hover:text-white transition-all text-sm"
                >
                  Start Chat Session
                </button>
                <Link
                  to="/screening"
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  Mental Health Screening
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Appointments