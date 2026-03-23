import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApi } from '../hooks/useApi'

const AppointmentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { callApi } = useApi()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      fetchAppointment()
    }
  }, [id])

  const fetchAppointment = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await callApi(`/api/v1/appointments/${id}`, 'GET')
      
      if (response.success) {
        const serverResponse = response.data || response
        setAppointment(serverResponse.appointment || serverResponse)
      } else {
        setError('Appointment not found')
      }
    } catch (err) {
      console.error('Error fetching appointment:', err)
      setError('Failed to load appointment details')
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const joinSession = () => {
    if (appointment.mode === 'video' || appointment.mode === 'chat' || appointment.mode === 'tele') {
      navigate(`/chat-platform?appointment=${appointment._id}&user=${appointment.counsellorId?._id || appointment.counsellorId}`)
    } else {
      alert('Please visit the counseling center at the scheduled time')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F7F4' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-800 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading appointment details...</p>
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
                onClick={fetchAppointment}
                className="px-4 py-2 bg-teal-800 text-white rounded-xl font-medium hover:bg-teal-900 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/appointments')}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Back to Appointments
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return null
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#F9F7F4' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/appointments')}
            className="flex items-center text-teal-800 hover:text-teal-900 transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Appointments
          </button>
          <h1 className="text-4xl font-bold text-teal-800">
            Appointment Details
          </h1>
          <p className="text-gray-500 text-lg mt-2">View your session information and manage your appointment</p>
        </div>

        {/* Main Appointment Card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Accent stripe */}
          <div className={`h-1.5 w-full ${getStatusDot(appointment.status)}`}></div>

          {/* Counsellor Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-[#F9E6D0] rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-teal-800">
                    {appointment.counsellor?.name?.charAt(0) || appointment.counsellorId?.name?.charAt(0) || 'C'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#2A3F47]">
                    {appointment.counsellor?.name || appointment.counsellorId?.name || 'Counsellor'}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {appointment.counsellor?.specialization || appointment.counsellorId?.specialization || 'Mental Health Professional'}
                  </p>
                  {(appointment.counsellor?.experience || appointment.counsellorId?.experience) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {appointment.counsellor?.experience || appointment.counsellorId?.experience} years experience
                    </p>
                  )}
                </div>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(appointment.status)}`}></span>
                {appointment.status || 'Pending'}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Date & Time Section */}
              <div>
                <h3 className="text-sm font-semibold tracking-widest text-teal-700 uppercase mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Date & Time
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Date</p>
                    <p className="font-medium text-[#2A3F47]">{formatDate(appointment.slotStart)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Time</p>
                    <p className="font-medium text-[#2A3F47]">
                      {formatTime(appointment.slotStart)} – {formatTime(appointment.slotEnd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Duration</p>
                    <p className="font-medium text-[#2A3F47]">{appointment.duration || '60'} minutes</p>
                  </div>
                </div>
              </div>

              {/* Session Info Section */}
              <div>
                <h3 className="text-sm font-semibold tracking-widest text-teal-700 uppercase mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Session Information
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Session Type</p>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {appointment.mode === 'video' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        ) : (appointment.mode === 'chat' || appointment.mode === 'tele') ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        )}
                      </svg>
                      <p className="font-medium text-[#2A3F47]">{getModeLabel(appointment.mode)}</p>
                    </div>
                  </div>
                  {appointment.urgency && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Priority</p>
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
                  {appointment.location && appointment.mode === 'in-person' && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Location</p>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="font-medium text-[#2A3F47]">{appointment.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reason */}
            {appointment.reason && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold tracking-widest text-teal-700 uppercase mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Reason for Consultation
                </h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-600 text-sm leading-relaxed">{appointment.reason}</p>
                </div>
              </div>
            )}

            {/* Private Notes */}
            {appointment.privateNotes && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold tracking-widest text-teal-700 uppercase mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Private Notes
                </h3>
                <div className="rounded-xl p-4 border border-gray-200" style={{ backgroundColor: '#F9E6D0' }}>
                  <p className="text-xs text-gray-500 mb-2 font-medium">
                    These notes are encrypted and only visible to you and your counsellor.
                  </p>
                  <p className="text-[#2A3F47] text-sm leading-relaxed">{appointment.privateNotes}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-100">
              {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                <button
                  onClick={joinSession}
                  className="flex-1 sm:flex-none px-6 py-3 bg-teal-800 text-white rounded-xl font-medium text-sm hover:bg-teal-900 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {appointment.mode === 'video' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    ) : (appointment.mode === 'chat' || appointment.mode === 'tele') ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    )}
                  </svg>
                  {appointment.mode === 'video' && 'Start Video Call'}
                  {(appointment.mode === 'chat' || appointment.mode === 'tele') && 'Start Chat Session'}
                  {appointment.mode === 'in-person' && 'View Meeting Details'}
                </button>
              )}

              {appointment.status === 'pending' && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this appointment?')) {
                      alert('Cancellation feature will be implemented')
                    }
                  }}
                  className="px-6 py-3 text-rose-600 border border-rose-200 rounded-xl text-sm font-medium hover:bg-rose-50 transition-colors"
                >
                  Cancel Appointment
                </button>
              )}

              <Link
                to="/booking"
                className="px-6 py-3 border-2 border-teal-800 text-teal-800 rounded-xl text-sm font-medium hover:bg-teal-800 hover:text-white transition-all"
              >
                Book Another Session
              </Link>
            </div>
          </div>
        </div>

        {/* Important Information Card */}
        <div className="mt-6 bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="h-1.5 w-full bg-teal-500"></div>
          <div className="p-6">
            <h4 className="font-semibold text-[#2A3F47] mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Important Information
            </h4>
            <div className="space-y-2">
              {[
                'Please join your session on time to make the most of your appointment',
                'If you need to reschedule, please do so at least 24 hours in advance',
                'All conversations are confidential and secure',
                'If you\'re in crisis, please contact emergency services immediately'
              ].map((item, i) => (
                <div key={i} className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-500 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppointmentDetails