import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useApi } from '../hooks/useApi'
import image2 from '../assets/illustration_2.png'

const CounsellorLogin = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const { callApi } = useApi()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await callApi('/api/v1/auth/counsellor/login', 'POST', formData)

      console.log('Counsellor login response:', response)

      if (response.success) {
        const serverResponse = response.data || response
        const token = serverResponse.token
        const user = serverResponse.user
        
        console.log('Storing counsellor token:', token)
        console.log('Storing counsellor user:', user)
        
        localStorage.setItem('Mann-Mitra_token', token)
        localStorage.setItem('token', token)
        const userJson = JSON.stringify(user)
        localStorage.setItem('user', userJson)
        localStorage.setItem('Mann-Mitra_user', userJson)

        navigate('/counsellor/dashboard')
      } else {
        const serverResponse = response.data || response
        setError(serverResponse.message || 'Invalid counsellor credentials')
      }
    } catch (error) {
      console.error('Counsellor login error:', error)
      setError('Failed to login. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-0 min-h-[70vh] rounded-3xl overflow-hidden shadow-xl">
      {/* Left Side - Form */}
      <div className="flex flex-col items-center justify-center py-12 px-6 sm:px-12 bg-white">
        <div className="max-w-md w-full space-y-8">
          {/* Mobile-only header */}
          <div className="text-center lg:hidden">
            <h1 className="text-3xl font-bold text-teal-800 mb-2">Counsellor Portal</h1>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#2A3F47] mb-2">Counsellor Portal</h2>
            <p className="text-gray-400">Access your counsellor dashboard and appointments</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-red-800 text-sm font-medium">Login Failed</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2A3F47] mb-2">
                Counsellor Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                placeholder="Counsellor email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#2A3F47] mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-white bg-teal-800 hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold transform hover:scale-[1.02] hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign in as Counsellor'
              )}
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="text-sm text-[#2A3F47] hover:text-teal-800 font-medium transition-colors">
              ← Back to member sign in
            </Link>
          </div>

          <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
            <p>Counsellor access provided by your institution administrator.</p>
            <p>Please contact your admin if you experience login issues.</p>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div
        className="hidden lg:flex flex-col items-center justify-center p-12 relative"
        style={{ backgroundColor: '#F9E6D0' }}
      >
        <div className="text-center max-w-md">
          <h2 className="text-4xl font-bold text-teal-800 mb-4 leading-tight">
            Help Students<br />Thrive
          </h2>
          <p className="text-lg text-[#2A3F47] leading-relaxed mb-8">
            Access your dashboard to manage appointments, connect with students, and provide professional mental health support.
          </p>
        </div>
        <img
          src={image2}
          alt="Counsellor illustration"
          className="max-w-xs w-full h-auto object-contain"
        />
      </div>
    </div>
  )
}

export default CounsellorLogin