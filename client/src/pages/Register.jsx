import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import image3 from '../assets/illustration_6.png'

const Register = () => {
  const { t } = useTranslation()
  const { register, isAuthenticated, isLoading, error } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    collegeId: '',
    languagePref: 'en',
    agreeToTerms: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    } else if (formData.name.length < 2 || formData.name.length > 50) {
      errors.name = 'Name must be between 2 and 50 characters'
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      errors.name = 'Name can only contain letters and spaces'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.collegeId.trim()) {
      errors.collegeId = 'College ID is required'
    } else if (formData.collegeId.length < 3 || formData.collegeId.length > 20) {
      errors.collegeId = 'College ID must be between 3 and 20 characters'
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.collegeId)) {
      errors.collegeId = 'College ID can only contain letters and numbers'
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const { confirmPassword, agreeToTerms, ...registrationData } = formData
      const result = await register(registrationData)
      if (result.success) {
        console.log('Registration successful')
      }
    } catch (error) {
      console.error('Registration error:', error)
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

  const inputClass = (field) =>
    `w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent transition-all bg-gray-50 hover:bg-white ${
      validationErrors[field] ? 'border-red-300' : 'border-gray-200'
    }`

  return (
    <div className="grid lg:grid-cols-5 gap-0 min-h-[80vh] rounded-3xl overflow-hidden shadow-xl">
      {/* Left Side - Form (3 cols) */}
      <div className="lg:col-span-3 flex flex-col items-center justify-center py-10 px-6 sm:px-12 bg-white">
        {/* Mobile-only header */}
        <div className="text-center lg:hidden mb-6">
          <h1 className="text-3xl font-bold text-teal-800 mb-2">Mann-Mitra</h1>
          <p className="text-gray-400 text-sm">Create your account</p>
        </div>

        <div className="max-w-xl w-full space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#2A3F47] mb-2">Student Registration</h2>
            <p className="text-gray-400">Create your anonymous student account for mental health support</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-3 flex-shrink-0"></div>
                  <div className="text-red-700 text-sm">{error}</div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#2A3F47] mb-2">Full Name *</label>
              <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange}
                className={inputClass('name')} placeholder="Enter your full name" />
              {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2A3F47] mb-2">{t('auth.email')} *</label>
              <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange}
                className={inputClass('email')} placeholder="Enter your email" />
              {validationErrors.email && <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#2A3F47] mb-2">{t('auth.password')} *</label>
                <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange}
                  className={inputClass('password')} placeholder="Create a password" />
                {validationErrors.password && <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#2A3F47] mb-2">Confirm Password *</label>
                <input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange}
                  className={inputClass('confirmPassword')} placeholder="Confirm your password" />
                {validationErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="collegeId" className="block text-sm font-medium text-[#2A3F47] mb-2">Student Roll Number / ID *</label>
              <input id="collegeId" name="collegeId" type="text" required value={formData.collegeId} onChange={handleChange}
                className={inputClass('collegeId')} placeholder="Enter your student roll number or ID" />
              {validationErrors.collegeId && <p className="mt-1 text-sm text-red-600">{validationErrors.collegeId}</p>}
              <p className="mt-1 text-xs text-gray-400">Your identity remains anonymous — this is only for admin verification</p>
            </div>

            <div>
              <label htmlFor="languagePref" className="block text-sm font-medium text-[#2A3F47] mb-2">Language Preference</label>
              <select id="languagePref" name="languagePref" value={formData.languagePref} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent transition-all bg-gray-50 hover:bg-white">
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="te">Telugu</option>
                <option value="ta">Tamil</option>
                <option value="bn">Bengali</option>
                <option value="mr">Marathi</option>
                <option value="gu">Gujarati</option>
                <option value="kn">Kannada</option>
                <option value="ml">Malayalam</option>
                <option value="or">Odia</option>
                <option value="pa">Punjabi</option>
                <option value="as">Assamese</option>
              </select>
            </div>

            <div className="flex items-center">
              <input id="agreeToTerms" name="agreeToTerms" type="checkbox" checked={formData.agreeToTerms} onChange={handleChange}
                className={`h-4 w-4 text-teal-800 focus:ring-teal-700 border-gray-300 rounded ${validationErrors.agreeToTerms ? 'border-red-300' : ''}`} />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-teal-700 hover:text-teal-800 font-medium">Terms and Conditions</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-teal-700 hover:text-teal-800 font-medium">Privacy Policy</Link>
              </label>
            </div>
            {validationErrors.agreeToTerms && <p className="text-sm text-red-600">{validationErrors.agreeToTerms}</p>}

            <button type="submit" disabled={isSubmitting}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-white bg-teal-800 hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold transform hover:scale-[1.02] hover:shadow-xl">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                t('auth.signup')
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-gray-500">
              {t('auth.haveAccount')}{' '}
              <Link to="/login" className="text-teal-700 hover:text-teal-800 font-semibold transition-colors">{t('auth.login')}</Link>
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400 mb-3">College Administration?</p>
            <Link to="/admin/signup" className="text-sm text-[#2A3F47] hover:text-teal-800 font-medium transition-colors">
              Create Admin Account
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration (2 cols) - mirrored from Login */}
      <div
        className="hidden lg:flex lg:col-span-2 flex-col items-center justify-center p-10 relative"
        style={{ backgroundColor: '#F9E6D0' }}
      >
        <div className="text-center max-w-sm">
          <h2 className="text-3xl font-bold text-teal-800 mb-4 leading-tight">
            Join the<br />Mann-Mitra Community
          </h2>
          <p className="text-base text-[#2A3F47] leading-relaxed mb-8">
            A safe, anonymous space for students to access mental health support, professional guidance, and peer connections.
          </p>
        </div>
        <img
          src={image3}
          alt="Student wellness illustration"
          className="max-w-[280px] w-full h-auto object-contain"
        />
      </div>
    </div>
  )
}

export default Register