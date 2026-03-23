import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi'

const TRIAGE_LABELS = {
  routine: 'Routine follow-up',
  monitor: 'Monitor',
  refer: 'Refer to counsellor',
  crisis_escalation: 'Crisis — urgent',
}

const ScreeningHistory = () => {
  const { callApi } = useApi()
  const [screenings, setScreenings] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      const result = await callApi('/api/v1/screenings/my-history?limit=50&page=1')
      if (cancelled) return
      if (result.success) {
        const payload = result.data
        const list = payload?.screenings || (Array.isArray(payload) ? payload : [])
        setScreenings(Array.isArray(list) ? list : [])
        setTotal(payload?.total ?? list.length ?? 0)
      } else {
        setError(result.error || 'Could not load screening history.')
        setScreenings([])
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: '#F9F7F4' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2A3F47]">My screening history</h1>
            <p className="text-gray-500 mt-1">
              Past PHQ-9 / GAD-7 results saved to your account ({total} total).
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/screening"
              className="px-4 py-2 bg-teal-800 text-white rounded-xl text-sm font-medium hover:bg-teal-900 transition-colors"
            >
              New screening
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="h-1.5 w-full bg-teal-500" />
          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-800 border-t-transparent mr-3" />
                Loading…
              </div>
            )}
            {!loading && error && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm">
                {error}
                <p className="mt-2 text-amber-800">
                  If you are not logged in, sign in so screenings can be linked to your account.
                </p>
              </div>
            )}
            {!loading && !error && screenings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No saved screenings yet.</p>
                <Link
                  to="/screening"
                  className="inline-flex px-6 py-3 bg-teal-800 text-white rounded-xl font-medium hover:bg-teal-900"
                >
                  Take your first screening
                </Link>
              </div>
            )}
            {!loading && !error && screenings.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Tool</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Triage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {screenings.map((row) => (
                      <tr key={row._id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                          {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{row.tool || '—'}</td>
                        <td className="px-4 py-3 font-medium text-[#2A3F47]">{row.score ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{row.severity || '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              row.triageAction === 'crisis_escalation'
                                ? 'bg-rose-100 text-rose-800'
                                : row.triageAction === 'refer'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {TRIAGE_LABELS[row.triageAction] || row.triageAction || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center max-w-2xl mx-auto">
          Screening tools are not a diagnosis. If you are in crisis, contact local emergency services or a crisis line
          immediately.
        </p>
      </div>
    </div>
  )
}

export default ScreeningHistory
