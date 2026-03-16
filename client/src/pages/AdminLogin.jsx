import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import image4 from '../assets/illustration_10.png'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const AdminLogin = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuth()
  
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
      const response = await fetch(`${API_BASE}/v1/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase(), password: formData.password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('Mann-Mitra_token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        navigate('/admin/dashboard')
      } else {
        setError(data.message || 'Invalid admin credentials')
      }
    } catch (error) {
      console.error('Admin login error:', error)
      setError('Failed to login. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-0 min-h-[70vh] rounded-3xl overflow-hidden shadow-xl">
      {/* Left Side - Illustration */}
      <div
        className="hidden lg:flex flex-col items-center justify-center p-12 relative"
        style={{ backgroundColor: '#F9E6D0' }}
      >
        <div className="text-center max-w-md">
          <h2 className="text-4xl font-bold text-teal-800 mb-4 leading-tight">
            Admin Portal
          </h2>
          <p className="text-lg text-[#2A3F47] leading-relaxed mb-8">
            Manage counsellors, verify students, and oversee the Mann-Mitra platform from a centralized, secure interface.
          </p>
        </div>
        <img
          src={image4}
          alt="Admin portal illustration"
          className="max-w-[260px] w-full h-auto object-contain"
        />
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-col items-center justify-center py-12 px-6 sm:px-12 bg-white">
        <div className="max-w-md w-full space-y-8">
          {/* Mobile-only header */}
          <div className="text-center lg:hidden">
            <h1 className="text-3xl font-bold text-teal-800 mb-2">Admin Portal</h1>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#2A3F47] mb-2">Admin Access</h2>
            <p className="text-gray-400">Administrative login for Mann-Mitra platform</p>
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
                Admin Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                placeholder="Admin email address"
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
                'Sign in as Admin'
              )}
            </button>
          </form>

          <div className="text-center space-y-3">
            <p className="text-gray-500 text-sm">
              Don&apos;t have an admin account?{' '}
              <Link to="/admin/signup" className="text-teal-700 hover:text-teal-800 font-semibold transition-colors">
                Create one
              </Link>
            </p>
            <Link to="/login" className="block text-sm text-[#2A3F47] hover:text-teal-800 font-medium transition-colors">
              ← Back to Student Login
            </Link>
          </div>

          <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
            <p>Administrative access is restricted to authorized personnel only.</p>
            <p>All activities are logged and monitored.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin