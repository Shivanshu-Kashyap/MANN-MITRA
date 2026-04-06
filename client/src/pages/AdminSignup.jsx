import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../utils/api'
import image5 from '../assets/illustration.png'

const API_BASE = API_BASE_URL

const AdminSignup = () => {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    organizationName: '',
    email: '',
    phoneNumber: '',
    department: '',
    organizationCode: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordErrors, setPasswordErrors] = useState([])

  const departments = [
    'Student Welfare',
    'Psychology',
    'IQAC',
    'Super Admin'
  ]

  const validatePassword = (password) => {
    const errors = []
    if (password.length < 8) errors.push('At least 8 characters long')
    if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter')
    if (!/[0-9]/.test(password)) errors.push('At least one number')
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least one symbol')
    return errors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (name === 'password') setPasswordErrors(validatePassword(value))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const passwordValidationErrors = validatePassword(formData.password)
    if (passwordValidationErrors.length > 0) {
      setError('Please fix password requirements')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/v1/auth/admin/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: formData.organizationName.trim(),
          email: formData.email.trim().toLowerCase(),
          phoneNumber: formData.phoneNumber.replace(/\D/g, '').slice(0, 10),
          department: formData.department,
          ...(formData.organizationCode?.trim() && { collegeCode: formData.organizationCode.trim() }),
          password: formData.password
        })
      })

      const data = await response.json()

      if (data.success) {
        navigate('/admin/login', { state: { message: 'Admin account created successfully. Please login.' } })
      } else {
        const message = data.errors?.length
          ? data.errors.map(e => e.msg || e.message).join('. ')
          : (data.message || 'Failed to create admin account')
        setError(message)
      }
    } catch (error) {
      console.error('Admin signup error:', error)
      setError('Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent transition-all bg-gray-50 hover:bg-white"

  return (
    <div className="grid lg:grid-cols-5 gap-0 min-h-[80vh] rounded-3xl overflow-hidden shadow-xl">
      {/* Left Side - Form (3 cols) */}
      <div className="lg:col-span-3 flex flex-col items-center justify-center py-10 px-6 sm:px-12 bg-white">
        <div className="max-w-xl w-full space-y-6">
          {/* Mobile-only header */}
          <div className="text-center lg:hidden">
            <h1 className="text-3xl font-bold text-teal-800 mb-2">Admin Registration</h1>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#2A3F47] mb-2">Admin Registration</h2>
            <p className="text-gray-400">Create an administrative account for your school, company, or other organization</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-red-800 text-sm font-medium">Registration Failed</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-[#2A3F47] mb-2">Organization name *</label>
              <input id="organizationName" name="organizationName" type="text" required className={inputClass}
                placeholder="School, company, or organization name" value={formData.organizationName} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#2A3F47] mb-2">Work email *</label>
                <input id="email" name="email" type="email" required className={inputClass}
                  placeholder="admin@yourorganization.org" value={formData.email} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-[#2A3F47] mb-2">Phone Number *</label>
                <input id="phoneNumber" name="phoneNumber" type="tel" required pattern="[0-9]{10}" className={inputClass}
                  placeholder="10-digit phone number" value={formData.phoneNumber} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-[#2A3F47] mb-2">Department/Role *</label>
                <select id="department" name="department" required className={inputClass} value={formData.department} onChange={handleChange}>
                  <option value="">Select Department/Role</option>
                  {departments.map((dept) => (<option key={dept} value={dept}>{dept}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="organizationCode" className="block text-sm font-medium text-[#2A3F47] mb-2">Organization code</label>
                <input id="organizationCode" name="organizationCode" type="text" className={inputClass}
                  placeholder="Internal reference (optional)" value={formData.organizationCode} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#2A3F47] mb-2">Password *</label>
                <input id="password" name="password" type="password" required className={inputClass}
                  placeholder="Create a strong password" value={formData.password} onChange={handleChange} />
                {passwordErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordErrors.map((err, index) => (
                      <p key={index} className="text-xs text-red-600 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2 flex-shrink-0"></span>
                        {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#2A3F47] mb-2">Confirm Password *</label>
                <input id="confirmPassword" name="confirmPassword" type="password" required className={inputClass}
                  placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                )}
              </div>
            </div>

            <button type="submit" disabled={isLoading || passwordErrors.length > 0}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-white bg-teal-800 hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold transform hover:scale-[1.02] hover:shadow-xl">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                'Create Admin Account'
              )}
            </button>
          </form>

          <div className="text-center space-y-3">
            <p className="text-gray-500 text-sm">
              Already have an admin account?{' '}
              <Link to="/admin/login" className="text-teal-700 hover:text-teal-800 font-semibold transition-colors">Sign in here</Link>
            </p>
            <Link to="/register" className="block text-sm text-[#2A3F47] hover:text-teal-800 font-medium transition-colors">
              ← Member registration
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration (2 cols) - mirrored from AdminLogin */}
      <div
        className="hidden lg:flex lg:col-span-2 flex-col items-center justify-center p-10 relative"
        style={{ backgroundColor: '#F9E6D0' }}
      >
        <div className="text-center max-w-sm">
          <h2 className="text-3xl font-bold text-teal-800 mb-4 leading-tight">
            Set Up Your<br />Institution
          </h2>
          <p className="text-base text-[#2A3F47] leading-relaxed mb-8">
            Register your organization so members can join and access mental health support through Mann-Mitra.
          </p>
        </div>
        <img
          src={image5}
          alt="Institution setup illustration"
          className="max-w-[240px] w-full h-auto object-contain"
        />
      </div>
    </div>
  )
}

export default AdminSignup