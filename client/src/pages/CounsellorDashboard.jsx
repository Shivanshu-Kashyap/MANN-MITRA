import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoImage from '../assets/Mann-mitra.png'
import { useApi } from '../hooks/useApi'
import { clearStoredAuth } from '../utils/routeAuth'

const tabs = [
  ['dashboard', 'Command Center'],
  ['appointments', 'Appointments'],
  ['certification', 'Certification'],
  ['availability', 'Availability'],
  ['reports', 'Reports'],
  ['profile', 'Profile'],
]

const STORAGE_KEY = 'counsellorAvailabilitySchedule'
const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const defaultSchedule = {
  monday: [{ start: '09:00', end: '17:00' }],
  tuesday: [{ start: '09:00', end: '17:00' }],
  wednesday: [{ start: '09:00', end: '17:00' }],
  thursday: [{ start: '09:00', end: '17:00' }],
  friday: [{ start: '09:00', end: '17:00' }],
  saturday: [],
  sunday: [],
}
const certificationSeed = [
  {
    id: 1,
    studentId: 'user123',
    studentName: 'Anonymous Student #1234',
    counsellorName: 'Dr. Sarah Johnson',
    date: '2025-09-30',
    time: '10:00',
    examScore: 87,
    status: 'scheduled',
    notes: 'Interested in peer support for anxiety and depression topics',
  },
  {
    id: 2,
    studentId: 'user456',
    studentName: 'Anonymous Student #5678',
    counsellorName: 'Dr. Sarah Johnson',
    date: '2025-09-28',
    time: '14:30',
    examScore: 92,
    status: 'completed',
    evaluation: {
      approved: true,
      notes: 'Excellent understanding of peer support principles.',
      recommendations: 'Recommended for certification approval.',
    },
  },
]

const cx = (...values) => values.filter(Boolean).join(' ')
const card =
  'rounded-[28px] border border-white/10 bg-[#0d1820]/88 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl'
const panel =
  'rounded-[28px] border border-white/10 bg-[#0d1820]/88 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl overflow-hidden'
const input =
  'w-full rounded-2xl border border-white/10 bg-[#09141b] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/35'
const ghostBtn =
  'inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-cyan-300/25 hover:bg-white/[0.08]'
const primaryBtn =
  'inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(45,212,191,0.28)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60'

const formatDate = (value, options = { year: 'numeric', month: 'short', day: 'numeric' }) =>
  value ? new Date(value).toLocaleDateString('en-US', options) : '—'
const formatDateTime = value =>
  value
    ? new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'
const formatTime = value =>
  value
    ? new Date(value).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '—'
const formatLongDate = value =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—'
const modeLabel = mode =>
  ({
    video: 'Video Call',
    tele: 'Online Session',
    chat: 'Online Session',
    'in-person': 'In-Person',
  })[mode?.toLowerCase()] || 'Session'
const badge = tone =>
  ({
    confirmed: 'bg-emerald-500/12 text-emerald-200 ring-1 ring-emerald-400/20',
    pending: 'bg-amber-500/12 text-amber-100 ring-1 ring-amber-400/20',
    requested: 'bg-amber-500/12 text-amber-100 ring-1 ring-amber-400/20',
    completed: 'bg-sky-500/12 text-sky-100 ring-1 ring-sky-400/20',
    cancelled: 'bg-rose-500/12 text-rose-100 ring-1 ring-rose-400/20',
    high: 'bg-rose-500/12 text-rose-100 ring-1 ring-rose-400/20',
    medium: 'bg-amber-500/12 text-amber-100 ring-1 ring-amber-400/20',
    low: 'bg-emerald-500/12 text-emerald-100 ring-1 ring-emerald-400/20',
    critical: 'bg-rose-500/12 text-rose-100 ring-1 ring-rose-400/20',
  })[tone?.toLowerCase()] || 'bg-white/8 text-slate-200 ring-1 ring-white/10'

const LoadingScreen = ({ label }) => (
  <div className='flex min-h-screen items-center justify-center bg-[#071115] px-6'>
    <div className='rounded-[28px] border border-white/10 bg-white/5 px-10 py-8 text-center shadow-2xl backdrop-blur-xl'>
      <div className='mx-auto h-12 w-12 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-200' />
      <p className='mt-4 text-sm font-medium uppercase tracking-[0.24em] text-slate-300'>{label}</p>
    </div>
  </div>
)

const Panel = ({ title, subtitle, action, children }) => (
  <section className={panel}>
    <div className='border-b border-white/8 px-6 py-5 sm:px-7'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-white'>{title}</h3>
          {subtitle && <p className='mt-1 text-sm text-slate-400'>{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
    <div className='px-6 py-6 sm:px-7'>{children}</div>
  </section>
)

const EmptyState = ({ title, body }) => (
  <div className='rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] px-6 py-12 text-center'>
    <div className='mx-auto h-14 w-14 rounded-2xl border border-white/10 bg-white/[0.06]' />
    <h4 className='mt-4 text-lg font-semibold text-white'>{title}</h4>
    <p className='mt-2 text-sm text-slate-400'>{body}</p>
  </div>
)

const StatCard = ({ label, value, hint, accent }) => (
  <div className='relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-5'>
    <div className={cx('absolute inset-x-0 top-0 h-1.5', accent)} />
    <p className='text-xs font-medium uppercase tracking-[0.22em] text-slate-400'>{label}</p>
    <p className='mt-4 text-4xl font-semibold text-white'>{value}</p>
    <p className='mt-3 text-sm text-slate-400'>{hint}</p>
  </div>
)

const Tag = ({ children, className = '' }) => (
  <span
    className={cx('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', className)}
  >
    {children}
  </span>
)
const TextField = props => <input {...props} className={cx(input, props.className)} />
const AreaField = props => <textarea {...props} className={cx(input, props.className)} />
const SelectField = ({ children, className = '', ...props }) => (
  <select {...props} className={cx(input, className)}>
    {children}
  </select>
)
const GhostButton = ({ children, className = '', ...props }) => (
  <button {...props} className={cx(ghostBtn, className)}>
    {children}
  </button>
)
const PrimaryButton = ({ children, className = '', ...props }) => (
  <button {...props} className={cx(primaryBtn, className)}>
    {children}
  </button>
)
const Modal = ({ children }) => (
  <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-md'>
    <div className='max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/12 bg-[#0b151c] shadow-[0_36px_100px_rgba(0,0,0,0.52)]'>
      {children}
    </div>
  </div>
)

const CounsellorDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('Mann-Mitra_token')
    if (!token || !userData) return navigate('/counsellor/login')
    try {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== 'counsellor') return navigate('/counsellor/login')
      setUser(parsedUser)
      setIsLoading(false)
    } catch (error) {
      console.error('Error parsing counsellor session:', error)
      navigate('/counsellor/login')
    }
  }, [navigate])

  if (isLoading) return <LoadingScreen label='Preparing counsellor workspace' />

  return (
    <div className='min-h-screen overflow-hidden bg-[#071115] text-white'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute left-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-cyan-500/12 blur-3xl' />
        <div className='absolute right-[-7rem] top-24 h-72 w-72 rounded-full bg-emerald-500/12 blur-3xl' />
        <div className='absolute bottom-[-8rem] left-1/3 h-80 w-80 rounded-full bg-sky-500/8 blur-3xl' />
      </div>

      <div className='relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8'>
        <header className='overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_38%),linear-gradient(135deg,rgba(9,20,27,0.96),rgba(14,28,36,0.88))] shadow-[0_30px_100px_rgba(0,0,0,0.45)]'>
          <div className='flex flex-col gap-8 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between'>
            <div className='flex flex-col gap-5 sm:flex-row sm:items-center'>
              <button
                onClick={() => navigate('/')}
                className='w-fit rounded-[22px] border border-white/10 bg-white/[0.06] p-3 transition hover:bg-white/[0.1]'
              >
                <img src={logoImage} alt='Mann-Mitra Logo' className='h-14 w-auto' />
              </button>
              <div>
                <p className='text-xs font-medium uppercase tracking-[0.3em] text-cyan-200/80'>
                  Counsellor dashboard
                </p>
                <h1 className='mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl'>
                  A sharper dark-mode workspace for every session.
                </h1>
                <p className='mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base'>
                  Review your day, respond to requests, complete reports, and manage availability
                  from one calm, high-contrast control surface.
                </p>
                <div className='mt-5 flex flex-wrap gap-3'>
                  <Tag className='bg-white/8 text-cyan-100 ring-1 ring-white/10'>
                    {user?.specialization || 'General Counselling'}
                  </Tag>
                  <Tag className='bg-emerald-500/12 text-emerald-100 ring-1 ring-emerald-400/20'>
                    Private session notes protected
                  </Tag>
                  <Tag className='bg-sky-500/12 text-sky-100 ring-1 ring-sky-400/20'>
                    Optimized for low-light focus
                  </Tag>
                </div>
              </div>
            </div>
            <div className='grid gap-4 sm:grid-cols-2 lg:w-[340px]'>
              <div className='rounded-[24px] border border-white/10 bg-white/[0.05] p-5'>
                <p className='text-xs uppercase tracking-[0.22em] text-slate-400'>Signed in as</p>
                <p className='mt-3 text-xl font-semibold text-white'>
                  {user?.name || 'Counsellor'}
                </p>
                <p className='mt-1 text-sm text-slate-400'>
                  {user?.email || 'Verified professional account'}
                </p>
              </div>
              <div className='flex flex-col justify-between rounded-[24px] border border-white/10 bg-white/[0.05] p-5'>
                <div>
                  <p className='text-xs uppercase tracking-[0.22em] text-slate-400'>
                    Workspace status
                  </p>
                  <p className='mt-3 text-xl font-semibold text-white'>Active</p>
                  <p className='mt-1 text-sm text-slate-400'>
                    Ready for live sessions and evaluations
                  </p>
                </div>
                <GhostButton
                  className='mt-4'
                  onClick={() => {
                    clearStoredAuth()
                    navigate('/counsellor/login')
                  }}
                >
                  Logout
                </GhostButton>
              </div>
            </div>
          </div>
        </header>

        <nav className='mt-6 rounded-[26px] border border-white/10 bg-white/[0.04] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl'>
          <div className='flex flex-wrap gap-2'>
            {tabs.map(([id, name]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cx(
                  'rounded-[20px] px-4 py-3 text-sm font-medium transition sm:px-5',
                  activeTab === id
                    ? 'bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-slate-950 shadow-[0_18px_35px_rgba(45,212,191,0.28)]'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </nav>

        <main className='mt-6 space-y-6'>
          {activeTab === 'dashboard' && <DashboardTab user={user} />}
          {activeTab === 'appointments' && <AppointmentsTab />}
          {activeTab === 'certification' && <CertificationTab />}
          {activeTab === 'availability' && <AvailabilityTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'profile' && <ProfileTab user={user} />}
        </main>
      </div>
    </div>
  )
}

const DashboardTab = ({ user }) => {
  const { callApi } = useApi()
  const [data, setData] = useState({
    appointments: [],
    stats: { today: 0, week: 0, pending: 0, completed: 0, urgent: 0 },
    loading: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await callApi('/api/v1/appointments/me', 'GET')
      const list = response.success ? (response.data || response).appointments || [] : []
      const now = new Date()
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      const today = list.filter(a => {
        const slot = new Date(a.slotStart)
        return slot >= dayStart && slot < dayEnd
      })
      setData({
        appointments: today.sort((a, b) => new Date(a.slotStart) - new Date(b.slotStart)),
        stats: {
          today: today.length,
          week: list.filter(a => new Date(a.slotStart) >= weekStart).length,
          pending: list.filter(a => ['pending', 'requested'].includes(a.status?.toLowerCase()))
            .length,
          completed: list.filter(a => a.status === 'completed').length,
          urgent: list.filter(a => a.urgency === 'high').length,
        },
        loading: false,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setData(current => ({ ...current, loading: false }))
    }
  }

  if (data.loading) return <LoadingScreen label='Loading dashboard insights' />

  const insights = [
    data.stats.today
      ? `${data.stats.today} session${data.stats.today > 1 ? 's' : ''} on your schedule today.`
      : 'Your calendar is clear today.',
    data.stats.pending
      ? `${data.stats.pending} request${data.stats.pending > 1 ? 's' : ''} still need your response.`
      : 'No appointment requests are waiting on you.',
    data.stats.urgent
      ? `${data.stats.urgent} high-priority case${data.stats.urgent > 1 ? 's are' : ' is'} flagged.`
      : 'No high-priority urgency flags right now.',
  ]

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          label="Today's sessions"
          value={data.stats.today}
          hint='Live calendar load for the day'
          accent='bg-cyan-400'
        />
        <StatCard
          label='This week'
          value={data.stats.week}
          hint='Upcoming and completed sessions this week'
          accent='bg-emerald-400'
        />
        <StatCard
          label='Pending requests'
          value={data.stats.pending}
          hint='Requests that still need a decision'
          accent='bg-amber-400'
        />
        <StatCard
          label='Completed'
          value={data.stats.completed}
          hint='Closed sessions with saved outcomes'
          accent='bg-sky-400'
        />
      </div>
      <div className='grid gap-6 xl:grid-cols-[1.65fr_1fr]'>
        <Panel
          title="Today's schedule"
          subtitle={`${data.appointments.length} appointment${data.appointments.length === 1 ? '' : 's'} lined up for ${user?.name || 'you'}.`}
          action={<GhostButton onClick={fetchData}>Refresh</GhostButton>}
        >
          {data.appointments.length === 0 ? (
            <EmptyState
              title='No appointments today'
              body='You have space to catch up on reports, update availability, or prepare for upcoming sessions.'
            />
          ) : (
            <div className='space-y-3'>
              {data.appointments.map(appointment => (
                <div
                  key={appointment._id}
                  className='rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.06]'
                >
                  <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-start'>
                      <div className='min-w-[132px] rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3 text-center'>
                        <p className='text-xs uppercase tracking-[0.2em] text-cyan-100/80'>
                          Session window
                        </p>
                        <p className='mt-2 text-sm font-semibold text-white'>
                          {formatTime(appointment.slotStart)} - {formatTime(appointment.slotEnd)}
                        </p>
                      </div>
                      <div>
                        <h4 className='text-base font-semibold text-white'>
                          {appointment.studentId?.name || 'Anonymous Student'}
                        </h4>
                        <p className='mt-1 text-sm text-slate-400'>{modeLabel(appointment.mode)}</p>
                        {appointment.reason && (
                          <p className='mt-2 max-w-xl text-sm text-slate-300'>
                            {appointment.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Tag className={badge(appointment.status)}>
                        {appointment.status || 'pending'}
                      </Tag>
                      {appointment.urgency && (
                        <Tag className={badge(appointment.urgency)}>
                          {appointment.urgency} priority
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel
          title='Care priorities'
          subtitle='A quick read on your workflow so you can act fast.'
        >
          <div className='space-y-3'>
            {insights.map((text, index) => (
              <div
                key={index}
                className='rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300'
              >
                {text}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

const AppointmentsTab = () => {
  const navigate = useNavigate()
  const { callApi } = useApi()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [completeAppointment, setCompleteAppointment] = useState(null)
  const [completeForm, setCompleteForm] = useState({ sessionRiskLevel: 'low', sessionSummary: '' })

  useEffect(() => {
    fetchAppointments()
  }, [])
  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await callApi('/api/v1/appointments/me', 'GET')
      setAppointments(response.success ? (response.data || response).appointments || [] : [])
      if (!response.success) setError('Failed to load appointments')
    } catch (err) {
      console.error('Error fetching counsellor appointments:', err)
      setError('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }
  const patchStatus = async (id, payload, successMessage) => {
    try {
      const response = await callApi(`/api/v1/appointments/${id}/status`, 'PATCH', payload)
      if (response.success) {
        fetchAppointments()
        if (successMessage) alert(successMessage)
      } else alert(response.error || 'Update failed')
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Failed to update appointment')
    }
  }
  const handleJoin = appointment => {
    try {
      if (['video', 'tele', 'chat'].includes(appointment.mode))
        navigate(
          `/chat-platform?appointment=${appointment._id}&user=${appointment.studentId?._id || appointment.studentId}`
        )
      else alert('Please prepare for the in-person session at the scheduled time and location.')
    } catch (error) {
      console.error('Error joining session:', error)
      alert('Unable to join session. Please try again.')
    }
  }
  const filtered = appointments.filter(appointment =>
    filter === 'all'
      ? true
      : filter === 'pending'
        ? ['pending', 'requested'].includes(appointment.status?.toLowerCase())
        : appointment.status?.toLowerCase() === filter
  )
  const filters = [
    ['all', 'All'],
    ['pending', 'Pending'],
    ['confirmed', 'Confirmed'],
    ['completed', 'Completed'],
    ['cancelled', 'Cancelled'],
  ]

  if (loading) return <LoadingScreen label='Loading appointments' />
  if (error)
    return (
      <Panel title='Appointments' subtitle='Something went wrong while loading your session queue.'>
        <div className='flex flex-col items-center gap-4 py-8 text-center'>
          <p className='text-rose-200'>{error}</p>
          <PrimaryButton onClick={fetchAppointments}>Retry</PrimaryButton>
        </div>
      </Panel>
    )

  return (
    <div className='space-y-6'>
      <Panel
        title='Appointment management'
        subtitle={`Review, confirm, complete, or cancel student sessions. ${appointments.length} total loaded.`}
        action={<GhostButton onClick={fetchAppointments}>Refresh list</GhostButton>}
      >
        <div className='flex flex-wrap gap-2'>
          {filters.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cx(
                'rounded-2xl px-4 py-2.5 text-sm font-medium transition',
                filter === key
                  ? 'bg-white text-slate-950 shadow-[0_14px_30px_rgba(255,255,255,0.12)]'
                  : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Panel>
      {filtered.length === 0 ? (
        <Panel title='No appointments found' subtitle='Your filtered view is empty.'>
          <EmptyState
            title='Nothing to review here'
            body={
              filter === 'all'
                ? 'No student appointments have been scheduled yet.'
                : `There are no ${filter} appointments right now.`
            }
          />
        </Panel>
      ) : (
        <div className='grid gap-4'>
          {filtered.map(appointment => (
            <div key={appointment._id || appointment.id} className={cx(card, 'p-5')}>
              <div className='flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between'>
                <div className='grid gap-4 md:grid-cols-[180px_1fr] xl:flex-1'>
                  <div className='rounded-[22px] border border-cyan-300/15 bg-cyan-400/10 p-4'>
                    <p className='text-xs uppercase tracking-[0.18em] text-cyan-100/80'>Date</p>
                    <p className='mt-2 text-sm font-semibold text-white'>
                      {formatDate(appointment.slotStart)}
                    </p>
                    <p className='mt-1 text-sm text-slate-300'>
                      {formatTime(appointment.slotStart)} - {formatTime(appointment.slotEnd)}
                    </p>
                  </div>
                  <div className='space-y-3'>
                    <div className='flex flex-wrap items-start justify-between gap-3'>
                      <div>
                        <h3 className='text-lg font-semibold text-white'>
                          {appointment.studentId?.name || 'Anonymous Student'}
                        </h3>
                        <p className='mt-1 text-sm text-slate-400'>
                          {appointment.studentId?.email || 'No email available'}
                        </p>
                        <p className='mt-1 text-sm text-slate-400'>
                          College ID: {appointment.studentId?.collegeId || '—'}
                        </p>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <Tag className={badge(appointment.status)}>
                          {appointment.status || 'pending'}
                        </Tag>
                        {appointment.urgency && (
                          <Tag className={badge(appointment.urgency)}>
                            {appointment.urgency} priority
                          </Tag>
                        )}
                        <Tag className='bg-white/8 text-slate-200 ring-1 ring-white/10'>
                          {modeLabel(appointment.mode)}
                        </Tag>
                      </div>
                    </div>
                    <div className='rounded-[22px] border border-white/8 bg-white/[0.03] p-4'>
                      <p className='text-xs uppercase tracking-[0.18em] text-slate-400'>Reason</p>
                      <p className='mt-2 text-sm leading-6 text-slate-300'>
                        {appointment.reason || 'No reason provided.'}
                      </p>
                      {appointment.privateNotes && (
                        <p className='mt-3 text-sm text-cyan-200'>
                          Private notes available for this appointment.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className='flex min-w-[220px] flex-col gap-2'>
                  {appointment.status === 'requested' && (
                    <>
                      <PrimaryButton
                        onClick={() =>
                          patchStatus(
                            appointment._id || appointment.id,
                            { status: 'confirmed' },
                            'Appointment confirmed successfully!'
                          )
                        }
                      >
                        Confirm request
                      </PrimaryButton>
                      <GhostButton
                        className='text-rose-100 hover:border-rose-300/25 hover:bg-rose-500/10'
                        onClick={() =>
                          window.confirm('Are you sure you want to cancel this appointment?') &&
                          patchStatus(
                            appointment._id || appointment.id,
                            { status: 'cancelled', cancellationReason: 'Cancelled by counsellor' },
                            'Appointment cancelled successfully!'
                          )
                        }
                      >
                        Decline
                      </GhostButton>
                    </>
                  )}
                  {appointment.status === 'confirmed' && (
                    <>
                      <PrimaryButton onClick={() => handleJoin(appointment)}>
                        {appointment.mode === 'video'
                          ? 'Join video session'
                          : ['tele', 'chat'].includes(appointment.mode)
                            ? 'Open chat session'
                            : 'Prepare session'}
                      </PrimaryButton>
                      <GhostButton
                        className='text-emerald-100 hover:border-emerald-300/25 hover:bg-emerald-500/10'
                        onClick={() => {
                          setCompleteAppointment(appointment)
                          setCompleteForm({ sessionRiskLevel: 'low', sessionSummary: '' })
                        }}
                      >
                        Mark complete
                      </GhostButton>
                      <GhostButton
                        className='text-rose-100 hover:border-rose-300/25 hover:bg-rose-500/10'
                        onClick={() =>
                          window.confirm('Are you sure you want to cancel this appointment?') &&
                          patchStatus(
                            appointment._id || appointment.id,
                            { status: 'cancelled', cancellationReason: 'Cancelled by counsellor' },
                            'Appointment cancelled successfully!'
                          )
                        }
                      >
                        Cancel session
                      </GhostButton>
                    </>
                  )}
                  {appointment.status === 'completed' && (
                    <div className='rounded-[20px] border border-emerald-400/15 bg-emerald-500/10 p-4 text-sm text-emerald-100'>
                      {appointment.sessionRiskLevel || 'No risk level'}{' '}
                      {appointment.sessionSummary ? '• Report saved' : ''}
                    </div>
                  )}
                  {['cancelled', 'pending'].includes(appointment.status) && (
                    <div className='rounded-[20px] border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400'>
                      No actions available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {completeAppointment && (
        <Modal>
          <div className='border-b border-white/8 px-6 py-5 sm:px-7'>
            <h3 className='text-xl font-semibold text-white'>Complete session</h3>
            <p className='mt-1 text-sm text-slate-400'>
              Add a risk level and concise summary for{' '}
              {completeAppointment.studentId?.name || 'this student'}.
            </p>
          </div>
          <div className='space-y-5 px-6 py-6 sm:px-7'>
            <div>
              <label className='mb-2 block text-sm font-medium text-slate-300'>
                Session risk level
              </label>
              <SelectField
                value={completeForm.sessionRiskLevel}
                onChange={event =>
                  setCompleteForm({ ...completeForm, sessionRiskLevel: event.target.value })
                }
              >
                <option value='low'>Low</option>
                <option value='medium'>Medium</option>
                <option value='high'>High</option>
                <option value='critical'>Critical</option>
              </SelectField>
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-slate-300'>
                Session summary
              </label>
              <AreaField
                rows={5}
                maxLength={2000}
                value={completeForm.sessionSummary}
                onChange={event =>
                  setCompleteForm({ ...completeForm, sessionSummary: event.target.value })
                }
                placeholder='Brief notes about the student, interventions, and any follow-up.'
              />
            </div>
            <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
              <GhostButton onClick={() => setCompleteAppointment(null)}>Cancel</GhostButton>
              <PrimaryButton
                onClick={() =>
                  patchStatus(
                    completeAppointment._id || completeAppointment.id,
                    {
                      status: 'completed',
                      sessionRiskLevel: completeForm.sessionRiskLevel,
                      sessionSummary: completeForm.sessionSummary.trim() || undefined,
                    },
                    'Session marked complete and report saved.'
                  )
                }
              >
                Complete and save
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
const AvailabilityTab = () => {
  const [schedule, setSchedule] = useState(defaultSchedule)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setSchedule(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to parse saved availability schedule:', error)
      }
    }
  }, [])

  const updateSlot = (day, index, field, value) => {
    setSchedule(current => ({
      ...current,
      [day]: current[day].map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [field]: value } : slot
      ),
    }))
    setSaved(false)
  }
  const addSlot = day => {
    setSchedule(current => ({
      ...current,
      [day]: [...current[day], { start: '09:00', end: '17:00' }],
    }))
    setSaved(false)
  }
  const removeSlot = (day, index) => {
    setSchedule(current => ({
      ...current,
      [day]: current[day].filter((_, slotIndex) => slotIndex !== index),
    }))
    setSaved(false)
  }
  const toggleDay = day => {
    setSchedule(current => ({
      ...current,
      [day]: current[day].length ? [] : [{ start: '09:00', end: '17:00' }],
    }))
    setSaved(false)
  }
  const saveSchedule = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2400)
  }

  return (
    <Panel
      title='Availability schedule'
      subtitle='Shape your working week with an editable dark-mode planner. Changes are saved locally on this device.'
      action={<PrimaryButton onClick={saveSchedule}>Save schedule</PrimaryButton>}
    >
      <div className='mb-5 flex flex-wrap items-center gap-3'>
        <Tag className='bg-cyan-500/12 text-cyan-100 ring-1 ring-cyan-400/20'>Weekly planning</Tag>
        <Tag className='bg-white/8 text-slate-200 ring-1 ring-white/10'>
          {saved ? 'Changes saved' : 'Unsaved changes'}
        </Tag>
      </div>
      <div className='space-y-4'>
        {dayOrder.map(day => (
          <div key={day} className='rounded-[24px] border border-white/10 bg-white/[0.04] p-5'>
            <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
              <div className='min-w-[180px]'>
                <p className='text-lg font-semibold capitalize text-white'>{day}</p>
                <p className='mt-1 text-sm text-slate-400'>
                  {schedule[day].length
                    ? `${schedule[day].length} active slot${schedule[day].length > 1 ? 's' : ''}`
                    : 'Marked unavailable'}
                </p>
              </div>
              <div className='flex-1 space-y-3'>
                {schedule[day].length === 0 ? (
                  <div className='rounded-[18px] border border-dashed border-white/12 bg-[#09141b] px-4 py-5 text-sm text-slate-400'>
                    No availability set for this day.
                  </div>
                ) : (
                  schedule[day].map((slot, index) => (
                    <div
                      key={`${day}-${index}`}
                      className='grid gap-3 rounded-[20px] border border-white/8 bg-[#09141b] p-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-center'
                    >
                      <TextField
                        type='time'
                        value={slot.start}
                        onChange={event => updateSlot(day, index, 'start', event.target.value)}
                      />
                      <span className='text-center text-sm text-slate-500'>to</span>
                      <TextField
                        type='time'
                        value={slot.end}
                        onChange={event => updateSlot(day, index, 'end', event.target.value)}
                      />
                      <GhostButton
                        className='text-rose-100 hover:border-rose-300/25 hover:bg-rose-500/10'
                        onClick={() => removeSlot(day, index)}
                      >
                        Remove
                      </GhostButton>
                    </div>
                  ))
                )}
              </div>
              <div className='flex flex-col gap-2 lg:w-[170px]'>
                <PrimaryButton onClick={() => addSlot(day)}>Add slot</PrimaryButton>
                <GhostButton onClick={() => toggleDay(day)}>
                  {schedule[day].length ? 'Block day' : 'Enable day'}
                </GhostButton>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

const ReportsTab = () => {
  const { callApi } = useApi()
  const [completed, setCompleted] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await callApi('/api/v1/appointments/me?includeCompleted=true', 'GET')
        if (!cancelled && res.success && res.data) {
          const list = res.data?.appointments ?? (Array.isArray(res.data) ? res.data : [])
          setCompleted(
            list
              .filter(appointment => appointment.status === 'completed')
              .sort((a, b) => new Date(b.slotStart) - new Date(a.slotStart))
          )
        }
      } catch (error) {
        console.error('Failed to load reports:', error)
      }
      if (!cancelled) setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [callApi])

  if (loading) return <LoadingScreen label='Loading session reports' />

  return (
    <Panel
      title='Session reports'
      subtitle='Completed sessions with risk level, follow-up notes, and outcome summaries.'
    >
      {completed.length === 0 ? (
        <EmptyState
          title='No completed sessions yet'
          body='Finish a session from the appointments tab to generate your first report entry here.'
        />
      ) : (
        <div className='space-y-4'>
          {completed.map(appointment => (
            <div
              key={appointment._id}
              className='rounded-[24px] border border-white/10 bg-white/[0.04] p-5'
            >
              <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                <div>
                  <h3 className='text-lg font-semibold text-white'>
                    {appointment.studentId?.name || 'Anonymous Student'}
                  </h3>
                  <p className='mt-1 text-sm text-slate-400'>
                    {formatDateTime(appointment.slotStart)}
                  </p>
                </div>
                <Tag className={badge(appointment.sessionRiskLevel || 'low')}>
                  {appointment.sessionRiskLevel || 'No risk level'}
                </Tag>
              </div>
              <div className='mt-4 rounded-[20px] border border-white/8 bg-[#09141b] p-4'>
                <p className='text-xs uppercase tracking-[0.18em] text-slate-500'>Summary</p>
                <p className='mt-2 text-sm leading-6 text-slate-300'>
                  {appointment.sessionSummary || 'No summary saved for this completed session.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

const ProfileTab = ({ user }) => (
  <div className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
    <Panel
      title='Profile details'
      subtitle='A calm, readable profile view for quick account checks.'
    >
      <div className='space-y-4'>
        {[
          ['Full name', user?.name || ''],
          ['Email address', user?.email || ''],
          ['Specialization', user?.specialization || 'General Counselling'],
        ].map(([label, value]) => (
          <div key={label}>
            <label className='mb-2 block text-sm font-medium text-slate-300'>{label}</label>
            <TextField readOnly value={value} />
          </div>
        ))}
      </div>
    </Panel>
    <Panel title='Professional status' subtitle='Account settings and update guidance.'>
      <div className='space-y-4'>
        <div className='rounded-[22px] border border-emerald-400/15 bg-emerald-500/10 p-4'>
          <p className='text-sm font-semibold text-emerald-100'>Institution-managed account</p>
          <p className='mt-2 text-sm leading-6 text-emerald-50/80'>
            Your profile information appears to be centrally managed. Contact your administrator if
            you need your name, email, or specialization updated.
          </p>
        </div>
        <div className='rounded-[22px] border border-white/10 bg-white/[0.04] p-4'>
          <p className='text-sm font-semibold text-white'>Visibility</p>
          <p className='mt-2 text-sm leading-6 text-slate-400'>
            Students only see the profile fields your organization exposes inside booking and live
            session flows.
          </p>
        </div>
      </div>
    </Panel>
  </div>
)

const CertificationTab = () => {
  const [interviews, setInterviews] = useState([])
  const [selected, setSelected] = useState(null)
  const [evaluation, setEvaluation] = useState({ approved: null, notes: '', recommendations: '' })

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('certificationInterviews') || '[]')
    if (stored.length === 0) {
      localStorage.setItem('certificationInterviews', JSON.stringify(certificationSeed))
      setInterviews(certificationSeed)
    } else setInterviews(stored)
  }, [])

  const closeModal = () => {
    setSelected(null)
    setEvaluation({ approved: null, notes: '', recommendations: '' })
  }
  const submitEvaluation = () => {
    const updated = interviews.map(interview =>
      interview.id === selected.id
        ? {
            ...interview,
            status: 'completed',
            evaluation: { ...evaluation, evaluatedAt: new Date().toISOString() },
          }
        : interview
    )
    setInterviews(updated)
    localStorage.setItem('certificationInterviews', JSON.stringify(updated))
    if (evaluation.approved) {
      const queue = JSON.parse(localStorage.getItem('certificationQueue') || '[]')
      queue.push({
        id: Date.now(),
        studentId: selected.studentId,
        studentName: selected.studentName,
        examScore: selected.examScore,
        interviewDate: selected.date,
        counsellorName: selected.counsellorName,
        counsellorNotes: evaluation.notes,
        status: 'pending_admin_approval',
        submittedAt: new Date().toISOString(),
      })
      localStorage.setItem('certificationQueue', JSON.stringify(queue))
    }
    closeModal()
  }

  const scheduled = interviews.filter(interview => interview.status === 'scheduled')
  const completed = interviews.filter(interview => interview.status === 'completed')

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-3'>
        <StatCard
          label='Scheduled'
          value={scheduled.length}
          hint='Interviews awaiting completion'
          accent='bg-cyan-400'
        />
        <StatCard
          label='Approved'
          value={completed.filter(interview => interview.evaluation?.approved).length}
          hint='Students recommended for certification'
          accent='bg-emerald-400'
        />
        <StatCard
          label='More training'
          value={completed.filter(interview => interview.evaluation?.approved === false).length}
          hint='Students requiring additional preparation'
          accent='bg-rose-400'
        />
      </div>
      <Panel
        title='Certification interview management'
        subtitle='Evaluate students who completed peer support training and forward approved recommendations.'
      >
        <div className='space-y-8'>
          <div>
            <h3 className='text-lg font-semibold text-white'>Scheduled interviews</h3>
            <p className='mt-1 text-sm text-slate-400'>Upcoming candidates ready for review.</p>
            <div className='mt-4 space-y-4'>
              {scheduled.length === 0 ? (
                <EmptyState
                  title='No scheduled interviews'
                  body='When candidates book their final assessment, they will appear here.'
                />
              ) : (
                scheduled.map(interview => (
                  <div
                    key={interview.id}
                    className='rounded-[24px] border border-white/10 bg-white/[0.04] p-5'
                  >
                    <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                      <div>
                        <h4 className='text-lg font-semibold text-white'>
                          {interview.studentName}
                        </h4>
                        <p className='mt-1 text-sm text-slate-400'>
                          {formatLongDate(interview.date)} at {interview.time}
                        </p>
                        <p className='mt-2 text-sm text-slate-300'>
                          Exam score: {interview.examScore}%
                        </p>
                        {interview.notes && (
                          <p className='mt-3 max-w-3xl text-sm leading-6 text-slate-400'>
                            {interview.notes}
                          </p>
                        )}
                      </div>
                      <PrimaryButton onClick={() => setSelected(interview)}>
                        Complete interview
                      </PrimaryButton>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <h3 className='text-lg font-semibold text-white'>Completed interviews</h3>
            <p className='mt-1 text-sm text-slate-400'>Reviewed outcomes and recommendations.</p>
            <div className='mt-4 space-y-4'>
              {completed.length === 0 ? (
                <EmptyState
                  title='No completed interviews yet'
                  body='Completed certification assessments will show up here with your recommendations.'
                />
              ) : (
                completed.map(interview => (
                  <div
                    key={interview.id}
                    className='rounded-[24px] border border-white/10 bg-white/[0.04] p-5'
                  >
                    <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                      <div>
                        <h4 className='text-lg font-semibold text-white'>
                          {interview.studentName}
                        </h4>
                        <p className='mt-1 text-sm text-slate-400'>
                          Interviewed on {formatLongDate(interview.date)} · Exam score:{' '}
                          {interview.examScore}%
                        </p>
                      </div>
                      <Tag
                        className={
                          interview.evaluation?.approved
                            ? 'bg-emerald-500/12 text-emerald-100 ring-1 ring-emerald-400/20'
                            : 'bg-rose-500/12 text-rose-100 ring-1 ring-rose-400/20'
                        }
                      >
                        {interview.evaluation?.approved
                          ? 'Approved for certification'
                          : 'Needs more training'}
                      </Tag>
                    </div>
                    {interview.evaluation?.notes && (
                      <div className='mt-4 rounded-[20px] border border-white/8 bg-[#09141b] p-4'>
                        <p className='text-xs uppercase tracking-[0.18em] text-slate-500'>
                          Evaluation notes
                        </p>
                        <p className='mt-2 text-sm leading-6 text-slate-300'>
                          {interview.evaluation.notes}
                        </p>
                        {interview.evaluation.recommendations && (
                          <>
                            <p className='mt-4 text-xs uppercase tracking-[0.18em] text-slate-500'>
                              Recommendations
                            </p>
                            <p className='mt-2 text-sm leading-6 text-slate-300'>
                              {interview.evaluation.recommendations}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Panel>
      {selected && (
        <Modal>
          <div className='border-b border-white/8 px-6 py-5 sm:px-7'>
            <h3 className='text-xl font-semibold text-white'>Interview evaluation</h3>
            <p className='mt-1 text-sm text-slate-400'>{selected.studentName}</p>
          </div>
          <div className='space-y-5 px-6 py-6 sm:px-7'>
            <div className='rounded-[24px] border border-cyan-300/12 bg-cyan-400/10 p-4'>
              <p className='text-sm text-slate-200'>Exam score: {selected.examScore}%</p>
              <p className='mt-1 text-sm text-slate-300'>
                Interview date: {formatLongDate(selected.date)}
              </p>
              {selected.notes && (
                <p className='mt-3 text-sm leading-6 text-slate-300'>{selected.notes}</p>
              )}
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-slate-300'>
                Certification recommendation
              </label>
              <div className='grid gap-3 sm:grid-cols-2'>
                <button
                  type='button'
                  onClick={() => setEvaluation({ ...evaluation, approved: true })}
                  className={cx(
                    'rounded-[22px] border px-4 py-4 text-left transition',
                    evaluation.approved === true
                      ? 'border-emerald-300/30 bg-emerald-500/12 text-emerald-50'
                      : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.06]'
                  )}
                >
                  <p className='font-semibold'>Approve</p>
                  <p className='mt-1 text-sm opacity-80'>
                    Recommend the student for certification.
                  </p>
                </button>
                <button
                  type='button'
                  onClick={() => setEvaluation({ ...evaluation, approved: false })}
                  className={cx(
                    'rounded-[22px] border px-4 py-4 text-left transition',
                    evaluation.approved === false
                      ? 'border-rose-300/30 bg-rose-500/12 text-rose-50'
                      : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.06]'
                  )}
                >
                  <p className='font-semibold'>Needs more training</p>
                  <p className='mt-1 text-sm opacity-80'>
                    Request more development before certification.
                  </p>
                </button>
              </div>
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-slate-300'>
                Evaluation notes
              </label>
              <AreaField
                rows={5}
                value={evaluation.notes}
                onChange={event => setEvaluation({ ...evaluation, notes: event.target.value })}
                placeholder='Provide detailed feedback on readiness, communication, judgment, and next steps.'
              />
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-slate-300'>
                Recommendations
              </label>
              <AreaField
                rows={4}
                value={evaluation.recommendations}
                onChange={event =>
                  setEvaluation({ ...evaluation, recommendations: event.target.value })
                }
                placeholder='Optional recommendations for further practice, supervision, or placement.'
              />
            </div>
            <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
              <GhostButton onClick={closeModal}>Cancel</GhostButton>
              <PrimaryButton
                disabled={evaluation.approved === null || !evaluation.notes.trim()}
                onClick={submitEvaluation}
              >
                Submit evaluation
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default CounsellorDashboard
