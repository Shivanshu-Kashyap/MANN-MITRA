import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CrisisModal = ({ isOpen, onClose, crisisType, onContactCounselor }) => {
  const [isContactingCounselor, setIsContactingCounselor] = useState(false)
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleContactCounselor = async () => {
    setIsContactingCounselor(true)
    try {
      await onContactCounselor()
    } catch (error) {
      console.error('Error contacting counselor:', error)
    } finally {
      setIsContactingCounselor(false)
    }
  }

  const isImmediate = crisisType === 'immediate'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in">

          {/* Header */}
          <div className={`px-6 py-5 text-white ${
            isImmediate
              ? 'bg-gradient-to-br from-red-600 to-rose-700'
              : 'bg-gradient-to-br from-amber-500 to-orange-600'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">We're Here For You</h2>
                <p className="text-white/80 text-sm mt-0.5">
                  {isImmediate
                    ? "We've noticed you may be going through a tough time"
                    : 'It looks like you could use some extra support'}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">

            {/* Supportive message */}
            <div className={`rounded-xl p-4 ${
              isImmediate ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'
            }`}>
              <p className={`text-sm leading-relaxed ${
                isImmediate ? 'text-red-800' : 'text-amber-800'
              }`}>
                {isImmediate
                  ? "Your feelings are valid and you matter. Please know you don't have to face this alone — professional support can make a real difference."
                  : "It's okay to ask for help. Talking to a counselor can provide you with personalized strategies and support."}
              </p>
            </div>

            {/* Action Cards */}
            <div className="space-y-3">

              {/* Book Counseling */}
              <button
                onClick={() => { onClose(); navigate('/booking') }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md group ${
                  isImmediate
                    ? 'border-red-200 hover:border-red-400 hover:bg-red-50'
                    : 'border-teal-200 hover:border-teal-400 hover:bg-teal-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isImmediate
                    ? 'bg-red-100 text-red-600 group-hover:bg-red-200'
                    : 'bg-teal-100 text-teal-600 group-hover:bg-teal-200'
                }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-900">Book a Counseling Session</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isImmediate ? 'Priority slot available — talk to a professional' : 'Schedule a session with a trained counselor'}
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Talk to Counselor Now */}
              <button
                onClick={handleContactCounselor}
                disabled={isContactingCounselor}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md group ${
                  isImmediate
                    ? 'border-red-200 hover:border-red-400 hover:bg-red-50'
                    : 'border-teal-200 hover:border-teal-400 hover:bg-teal-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isImmediate
                    ? 'bg-red-100 text-red-600 group-hover:bg-red-200'
                    : 'bg-teal-100 text-teal-700 group-hover:bg-teal-200'
                }`}>
                  {isContactingCounselor ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  )}
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-900">
                    {isContactingCounselor ? 'Connecting...' : 'Talk to a Counselor Now'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Get connected to a live counselor via chat</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Browse Resources */}
              <button
                onClick={() => { onClose(); navigate('/resources') }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-teal-200 hover:border-teal-400 hover:bg-teal-50 transition-all duration-200 hover:shadow-md group"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-900">Browse Self-Help Resources</p>
                  <p className="text-xs text-gray-500 mt-0.5">Explore guided courses, articles & exercises</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Continue Chat */}
            <button
              onClick={onClose}
              className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Continue chatting with Buddy
            </button>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
            <p className="text-center text-gray-400 text-xs">
              Buddy is an AI assistant, not a licensed therapist. For emergencies, please contact your local emergency services.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CrisisModal
