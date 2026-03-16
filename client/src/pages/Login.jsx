import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import image1 from '../assets/illustration_1.png'

const Login = () => {
  const { t } = useTranslation()
  const { login, isAuthenticated, isLoading, error } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await login(formData)
      if (result.success) {
        console.log('Login successful')
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-0 min-h-[75vh] rounded-3xl overflow-hidden shadow-xl">
      {/* Left Side - Illustration */}
      <div
        className="hidden lg:flex flex-col items-center justify-center p-12 relative"
        style={{ backgroundColor: '#F9E6D0' }}
      >
        <div className="text-center max-w-md">
          <h2 className="text-4xl font-bold text-teal-800 mb-4 leading-tight">
            Welcome Back to<br />Mann-Mitra
          </h2>
          <p className="text-lg text-[#2A3F47] leading-relaxed mb-10">
            Your trusted companion for mental wellness. Sign in to access AI support, professional counsellors, and peer guidance.
          </p>
        </div>
        <img
          src={image1}
          alt="Mental wellness illustration"
          className="max-w-xs w-full h-auto object-contain"
        />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-col items-center justify-center py-12 px-6 sm:px-12 bg-white">
        {/* Mobile-only header */}
        <div className="text-center lg:hidden mb-6">
          <h1 className="text-3xl font-bold text-teal-800 mb-2">Mann-Mitra</h1>
          <p className="text-gray-400 text-sm">Your mental wellness companion</p>
        </div>

        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#2A3F47] mb-2">
              {t('auth.login')}
            </h2>
            <p className="text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-3 flex-shrink-0"></div>
                  <div className="text-red-700 text-sm">{error}</div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2A3F47] mb-2">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#2A3F47] mb-2">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-teal-800 focus:ring-teal-700 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="text-teal-700 hover:text-teal-800 font-medium transition-colors">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-white bg-teal-800 hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold transform hover:scale-[1.02] hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-gray-500">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-teal-700 hover:text-teal-800 font-semibold transition-colors">
                {t('auth.signup')}
              </Link>
            </p>
          </div>

          {/* Staff Access Links */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-400 mb-4 uppercase tracking-wider font-medium">
              Staff Access
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
              <Link
                to="/admin/login"
                className="text-sm text-[#2A3F47] hover:text-teal-800 font-medium transition-colors"
              >
                Admin Login
              </Link>
              <span className="text-gray-200">|</span>
              <Link
                to="/admin/signup"
                className="text-sm text-[#2A3F47] hover:text-teal-800 font-medium transition-colors"
              >
                Admin Sign Up
              </Link>
              <span className="text-gray-200">|</span>
              <Link
                to="/counsellor/login"
                className="text-sm text-[#2A3F47] hover:text-teal-800 font-medium transition-colors"
              >
                Counsellor Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login