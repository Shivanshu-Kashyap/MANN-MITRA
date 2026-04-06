import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { BUDDY_AGENT_URL } from '../../utils/api'

const StudentDashboard = () => {
  const { user } = useAuth()
  const { callApi } = useApi()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    screeningsCompleted: 0,
    appointmentsScheduled: 0,
    forumPosts: 0,
    resourcesAccessed: 0
  })
  const [appointments, setAppointments] = useState([])
  const [latestAppointment, setLatestAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmedAppointments, setConfirmedAppointments] = useState([])
  const [latestScreening, setLatestScreening] = useState(null)
  const [wellnessPlan, setWellnessPlan] = useState([])
  const [planChecks, setPlanChecks] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (!latestScreening?._id || !wellnessPlan.length) {
      setPlanChecks([])
      return
    }
    const key = `mann_mitra_wellness_${latestScreening._id}`
    let saved = []
    try {
      const raw = localStorage.getItem(key)
      saved = raw ? JSON.parse(raw) : []
    } catch {
      saved = []
    }
    const next = wellnessPlan.map((_, i) => Boolean(saved[i]))
    setPlanChecks(next)
  }, [latestScreening?._id, wellnessPlan])

  const togglePlanStep = (index) => {
    if (!latestScreening?._id || !wellnessPlan.length) return
    setPlanChecks((prev) => {
      const len = wellnessPlan.length
      const base = wellnessPlan.map((_, i) => (i < prev.length ? prev[i] : false))
      const next = base.map((v, i) => (i === index ? !v : v))
      localStorage.setItem(`mann_mitra_wellness_${latestScreening._id}`, JSON.stringify(next))
      return next
    })
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const savedAppointment = localStorage.getItem('latestAppointment')
      if (savedAppointment) {
        setLatestAppointment(JSON.parse(savedAppointment))
      }

      const [appointmentsResponse, screeningsResponse] = await Promise.all([
        callApi('/api/v1/appointments/me'),
        callApi('/api/v1/screenings/my-history?limit=1'),
      ])
      if (appointmentsResponse.success) {
        const fetchedAppointments = appointmentsResponse.data || []
        setAppointments(fetchedAppointments)

        const confirmed = fetchedAppointments.filter(apt =>
          apt.status === 'confirmed' &&
          (apt.mode === 'tele' || apt.mode === 'video' || apt.mode === 'chat')
        )
        setConfirmedAppointments(confirmed)

        if (fetchedAppointments.length > 0) {
          const mostRecent = fetchedAppointments[fetchedAppointments.length - 1]
          if (mostRecent) {
            const formattedAppointment = {
              id: mostRecent._id,
              counsellor: mostRecent.counsellorId,
              date: mostRecent.slotStart.split('T')[0],
              startTime: new Date(mostRecent.slotStart).getHours() + new Date(mostRecent.slotStart).getMinutes() / 60,
              duration: Math.round((new Date(mostRecent.slotEnd) - new Date(mostRecent.slotStart)) / (1000 * 60)),
              mode: mostRecent.mode === 'in-person' ? 'in-person' : mostRecent.mode === 'tele' ? 'video' : 'chat',
              reason: mostRecent.reason,
              urgency: mostRecent.urgency,
              location: mostRecent.location,
              status: mostRecent.status,
              createdAt: mostRecent.createdAt
            }
            setLatestAppointment(formattedAppointment)
            localStorage.setItem('latestAppointment', JSON.stringify(formattedAppointment))
          }
        }

        const latest = screeningsResponse?.success ? screeningsResponse.data?.screenings?.[0] : null
        setLatestScreening(latest || null)
        setWellnessPlan(await buildWellnessPlan(latest))

        setStats({
          screeningsCompleted: screeningsResponse?.success ? (screeningsResponse.data?.total || screeningsResponse.data?.count || 0) : 0,
          appointmentsScheduled: fetchedAppointments.length,
          forumPosts: 5,
          resourcesAccessed: 12
        })
      } else {
        const saved = localStorage.getItem('latestAppointment')
        const latest = screeningsResponse?.success ? screeningsResponse.data?.screenings?.[0] : null
        setLatestScreening(latest || null)
        setWellnessPlan(await buildWellnessPlan(latest))

        setStats({
          screeningsCompleted: screeningsResponse?.success ? (screeningsResponse.data?.total || screeningsResponse.data?.count || 0) : 0,
          appointmentsScheduled: saved ? 1 : 0,
          forumPosts: 5,
          resourcesAccessed: 12
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      const saved = localStorage.getItem('latestAppointment')
      setStats({
        screeningsCompleted: 0,
        appointmentsScheduled: saved ? 1 : 0,
        forumPosts: 5,
        resourcesAccessed: 12
      })
    } finally {
      setLoading(false)
    }
  }

  const buildWellnessPlan = async (screening) => {
    if (!screening) return []

    const level = (screening.severity || '').toLowerCase()
    const basePlan = level.includes('severe')
      ? [
          'Book a counsellor session in the next 24 hours.',
          'Tell one trusted person how you are feeling today.',
          'Use grounding for 5 minutes: 5 things you see, 4 feel, 3 hear.',
        ]
      : level.includes('moderate')
      ? [
          'Schedule a counselling check-in this week.',
          'Do 10 minutes of breathing + journaling daily.',
          'Follow a fixed sleep and wake routine for 7 days.',
        ]
      : [
          'Keep a simple daily mood log for one week.',
          'Do one stress-relief activity each day (walk, music, stretching).',
          'Review your progress and retake screening after 2 weeks.',
        ]

    try {
      const query = `Give 3 short mental wellness action steps for ${screening.severity || 'mild'} depression screening score ${screening.score}.`
      const encodedQuery = encodeURIComponent(query)
      const response = await fetch(`${BUDDY_AGENT_URL}/knowledge-base/search?query=${encodedQuery}&n_results=3`)
      if (!response.ok) return basePlan

      const data = await response.json()
      const kbPlan = (data?.results || [])
        .map(item => item?.text || '')
        .filter(Boolean)
        .map(text => text.split('\n')[0].trim())
        .filter(Boolean)
        .slice(0, 3)

      return kbPlan.length ? kbPlan : basePlan
    } catch (err) {
      return basePlan
    }
  }

  const startChatSession = (appointment) => {
    const counsellorId = appointment.counsellorId?._id || appointment.counsellorId
    if (!counsellorId || !appointment._id) {
      alert('Cannot start chat: Missing counsellor or appointment information')
      return
    }
    navigate(`/chat-platform?appointment=${appointment._id}&user=${counsellorId}`)
  }

  const statCards = [
    { label: 'Screenings Completed', value: stats.screeningsCompleted, accent: 'bg-teal-500' },
    { label: 'Appointments Scheduled', value: stats.appointmentsScheduled, accent: 'bg-amber-500' },
    { label: 'Forum Posts', value: stats.forumPosts, accent: 'bg-sky-500' },
    { label: 'Resources Accessed', value: stats.resourcesAccessed, accent: 'bg-violet-500' }
  ]

  const quickActions = [
    { title: 'Mental Health Screening', description: 'Complete a quick assessment', link: '/screening', accent: 'bg-teal-500' },
    { title: 'Book Counselling', description: 'Schedule a professional session', link: '/booking', accent: 'bg-amber-500' },
    { title: 'Community Forum', description: 'Connect with peers', link: '/forum', accent: 'bg-sky-500' },
    { title: 'Access Resources', description: 'Browse articles & tools', link: '/resources', accent: 'bg-violet-500' },
    { title: 'My Appointments', description: 'View & manage sessions', link: '/appointments', accent: 'bg-emerald-500' },
    { title: 'Screening history', description: 'Past PHQ-9 / GAD-7 results', link: '/screenings/history', accent: 'bg-violet-500' }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2A3F47] mb-2">
            Welcome back, {user?.anonymousDisplayName || user?.name}!
          </h1>
          <p className="text-gray-500">
            Here's what's happening with your mental health journey today.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className={`h-1.5 w-full ${stat.accent}`}></div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-[#2A3F47]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Latest Screening + Plan */}
        {latestScreening && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="h-1.5 w-full bg-violet-500"></div>
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="text-xl font-bold text-[#2A3F47]">Your Latest Screening Report</h2>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700">
                    {latestScreening.tool} • Score {latestScreening.score} • {latestScreening.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Completed on {new Date(latestScreening.createdAt).toLocaleString()}
                </p>
                <h3 className="font-semibold text-[#2A3F47] mb-2">Your plan — track progress</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Check off steps as you go (saved on this device only).
                </p>
                <ul className="space-y-2 mb-4">
                  {wellnessPlan.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => togglePlanStep(index)}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          planChecks[index]
                            ? 'border-violet-600 bg-violet-600 text-white'
                            : 'border-gray-300 bg-white hover:border-violet-400'
                        }`}
                        aria-pressed={planChecks[index]}
                        aria-label={planChecks[index] ? 'Mark step incomplete' : 'Mark step complete'}
                      >
                        {planChecks[index] ? (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : null}
                      </button>
                      <span className={planChecks[index] ? 'line-through text-gray-400' : ''}>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/screenings/history"
                    className="px-4 py-2 border border-violet-200 text-violet-800 text-sm font-medium rounded-xl hover:bg-violet-50 transition-colors"
                  >
                    Full history
                  </Link>
                  <Link
                    to="/booking"
                    className="px-4 py-2 bg-teal-800 text-white text-sm font-medium rounded-xl hover:bg-teal-900 transition-colors"
                  >
                    Book Counsellor
                  </Link>
                  <Link
                    to="/resources"
                    className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Open Resources
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Latest Appointment */}
        {latestAppointment && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#2A3F47] mb-4">Latest Appointment</h2>
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="h-1.5 w-full bg-teal-500"></div>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-[#F9E6D0] rounded-full flex items-center justify-center mr-4">
                        <span className="text-lg font-bold text-teal-800">
                          {latestAppointment.counsellor?.name?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#2A3F47]">{latestAppointment.counsellor?.name}</h3>
                        <p className="text-sm text-gray-500">{latestAppointment.counsellor?.specialization}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Date</p>
                        <p className="text-sm font-medium text-[#2A3F47]">
                          {new Date(latestAppointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {latestAppointment.startTime > 12 ? `${latestAppointment.startTime - 12}:00 PM` : `${latestAppointment.startTime}:00 AM`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Duration</p>
                        <p className="text-sm font-medium text-[#2A3F47]">{latestAppointment.duration} minutes</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Session Type</p>
                        <p className="text-sm font-medium text-[#2A3F47] capitalize">
                          {latestAppointment.mode === 'in-person' ? 'Offline Meet' : latestAppointment.mode === 'video' ? 'Video Call' : 'Online Chat'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Status</p>
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          latestAppointment.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                          latestAppointment.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                          latestAppointment.status === 'cancelled' ? 'bg-rose-50 text-rose-700' :
                          'bg-sky-50 text-sky-700'
                        }`}>
                          {latestAppointment.status?.charAt(0).toUpperCase() + latestAppointment.status?.slice(1) || 'Pending'}
                        </span>
                      </div>
                    </div>

                    {latestAppointment.reason && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-1">Reason</p>
                        <p className="text-sm text-gray-600">{latestAppointment.reason}</p>
                      </div>
                    )}

                    {latestAppointment.location && latestAppointment.mode === 'in-person' && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-1">Location</p>
                        <p className="text-sm text-gray-600">{latestAppointment.location}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
                  {latestAppointment.status === 'confirmed' &&
                   (latestAppointment.mode === 'video' || latestAppointment.mode === 'chat') && (
                    <button
                      onClick={() => startChatSession({
                        _id: latestAppointment.id,
                        counsellorId: latestAppointment.counsellor
                      })}
                      className="px-4 py-2 bg-teal-800 text-white text-sm font-medium rounded-xl hover:bg-teal-900 transition-colors"
                    >
                      Start Chat
                    </button>
                  )}
                  <Link
                    to="/appointments"
                    className="px-4 py-2 bg-teal-800 text-white text-sm font-medium rounded-xl hover:bg-teal-900 transition-colors"
                  >
                    View All Appointments
                  </Link>
                  <Link
                    to="/booking"
                    className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Book Another Session
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Counsellor Sessions */}
        {confirmedAppointments.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#2A3F47] mb-4">Chat with Your Counsellors</h2>
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="h-1.5 w-full bg-sky-500"></div>
              <div className="p-6 space-y-4">
                {confirmedAppointments.map((appointment, index) => (
                  <div key={appointment._id || index} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#F9E6D0] rounded-full flex items-center justify-center">
                        <span className="font-bold text-teal-800">
                          {appointment.counsellorId?.name?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#2A3F47]">
                          {appointment.counsellorId?.name || 'Counsellor'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {appointment.mode === 'video' && 'Video Session'}
                          {appointment.mode === 'tele' && 'Online Session'}
                          {appointment.mode === 'chat' && 'Chat Session'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(appointment.slotStart).toLocaleDateString()} at{' '}
                          {new Date(appointment.slotStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startChatSession(appointment)}
                        className="px-4 py-2 bg-teal-800 text-white text-sm font-medium rounded-xl hover:bg-teal-900 transition-colors"
                      >
                        Chat
                      </button>
                      {(appointment.mode === 'video' || appointment.mode === 'tele') && (
                        <button
                          onClick={() => startChatSession(appointment)}
                          className="px-4 py-2 border-2 border-teal-800 text-teal-800 text-sm font-medium rounded-xl hover:bg-teal-800 hover:text-white transition-all"
                        >
                          Video Call
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-100 text-center">
                  <p className="text-sm text-gray-500 mb-3">
                    You can chat with your counsellors anytime during confirmed session periods
                  </p>
                  <Link to="/appointments" className="text-teal-800 hover:text-teal-900 text-sm font-semibold">
                    View All Appointments →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : appointments.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="h-1.5 w-full bg-amber-500"></div>
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-[#F9E6D0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#2A3F47] mb-2">Ready to Connect?</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Once your appointments are confirmed, you can start chatting and video calling with your counsellors directly from here.
                </p>
                <div className="flex justify-center gap-3">
                  <Link to="/appointments" className="px-4 py-2 bg-teal-800 text-white text-sm font-medium rounded-xl hover:bg-teal-900 transition-colors">
                    Check Status
                  </Link>
                  <Link to="/booking" className="px-4 py-2 border-2 border-teal-800 text-teal-800 text-sm font-medium rounded-xl hover:bg-teal-800 hover:text-white transition-all">
                    Book New Session
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#2A3F47] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
              >
                <div className={`h-1.5 w-full ${action.accent}`}></div>
                <div className="p-5 text-center">
                  <h3 className="font-semibold text-[#2A3F47] mb-1 text-sm">{action.title}</h3>
                  <p className="text-xs text-gray-400">{action.description}</p>
                </div>
              </Link>
            ))}

            {confirmedAppointments.length > 0 && (
              <button
                onClick={() => {
                  if (confirmedAppointments.length === 1) {
                    startChatSession(confirmedAppointments[0])
                  } else {
                    navigate('/appointments')
                  }
                }}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group text-left"
              >
                <div className="h-1.5 w-full bg-rose-500"></div>
                <div className="p-5 text-center">
                  <h3 className="font-semibold text-[#2A3F47] mb-1 text-sm">Start Chat Session</h3>
                  <p className="text-xs text-gray-400">
                    {confirmedAppointments.length === 1
                      ? `Chat with ${confirmedAppointments[0].counsellorId?.name || 'your counsellor'}`
                      : 'Choose a counsellor to chat with'
                    }
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="h-1.5 w-full bg-teal-500"></div>
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-[#2A3F47]">Recent Activity</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-800"></div>
                <span className="ml-3 text-gray-500">Loading activities...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {latestAppointment && (
                  <div className="flex items-center space-x-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                    <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-[#2A3F47]">
                        Booked counselling session with {latestAppointment.counsellor?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(latestAppointment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                  <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-[#2A3F47]">Completed PHQ-9 screening</p>
                    <p className="text-xs text-gray-400">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                  <div className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-[#2A3F47]">Posted in "Stress Management" forum</p>
                    <p className="text-xs text-gray-400">3 days ago</p>
                  </div>
                </div>

                {!latestAppointment && appointments.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No recent activity</p>
                    <Link
                      to="/booking"
                      className="inline-flex items-center px-4 py-2 bg-teal-800 text-white text-sm font-medium rounded-xl hover:bg-teal-900 transition-colors"
                    >
                      Book Your First Session
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard