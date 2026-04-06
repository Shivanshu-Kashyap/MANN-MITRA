import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { FiUser, FiLogIn, FiMessageSquare, FiBookOpen, FiUsers, FiHelpCircle, FiGlobe, FiArrowRight } from 'react-icons/fi'
import LanguageSwitcher from './common/LanguageSwitcher'
import logoImage from '../assets/Mann-mitra.png'

const navItems = [
  {
    path: '/chat',
    label: 'Buddy',
    icon: <FiMessageSquare />
  },
  {
    path: '/booking',
    label: 'Counsellor Talk',
    icon: <FiHelpCircle />
  },
  {
    path: '/forum',
    label: 'Peer Talk',
    icon: <FiUsers />
  },
  {
    path: '/resources',
    label: 'Resource Hub',
    icon: <FiBookOpen />
  },
  {
    path: '/about',
    label: 'About',
    icon: <FiGlobe />
  }
]

const Header = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const isActivePath = (path) => location.pathname.startsWith(path)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-14 md:h-16">

          {/* Logo as Home Link */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <img 
              src={logoImage} 
              alt="Mann-Mitra Logo" 
              className="h-10 md:h-12 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
            />
            <span className="text-xl md:text-[22px] font-bold text-[#466a65] tracking-tight">Mann-Mitra</span>
          </Link>

          {/* Navbar links - centered */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-5 lg:gap-8 xl:gap-10">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-1 py-1 text-[15px] font-medium transition-all duration-200
                  ${isActivePath(item.path)
                    ? 'text-[#466a65] border-b-2 border-[#466a65]'
                    : 'text-gray-500 hover:text-[#466a65]'}
                  `}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side – profile menu and toggler */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {isAuthenticated ? (
              <div className="relative">
                <button
                  className="flex items-center space-x-2 px-3 py-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => setIsDropdownOpen((open) => !open)}
                  aria-label="User menu"
                  aria-expanded={isDropdownOpen}
                >
                  <FiUser className="w-6 h-6" />
                  <span className="hidden md:block">{user?.anonymousDisplayName || 'User'}</span>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      className="flex items-center px-4 py-2 w-full text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      onClick={() => {
                        setIsDropdownOpen(false)
                        navigate('/dashboard')
                      }}
                    >
                      <FiUser className="mr-2" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      className="flex items-center px-4 py-2 w-full text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      onClick={() => {
                        setIsDropdownOpen(false)
                        logout()
                      }}
                    >
                      <FiLogIn className="mr-2" />
                      <span>{t('auth.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-2.5 bg-[#466a65] text-white hover:bg-[#385551] shadow-sm rounded-lg transition font-medium text-sm"
              >
                <span>{t('auth.login')}</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            )}

            <button
              onClick={() => setIsMenuOpen((open) => !open)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ml-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* MOBILE NAV */}
        {isMenuOpen && (
          <nav className="lg:hidden border-t border-gray-200 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                  isActivePath(item.path)
                    ? 'bg-[#466a65]/10 text-[#466a65]'
                    : 'text-gray-600 hover:text-[#466a65] hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <button
                className="block w-full text-left px-4 py-3 text-base font-medium text-gray-600 hover:text-[#466a65] hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => {
                  setIsMenuOpen(false)
                  navigate('/about')
                }}
              >
                {t('nav.about')}
              </button>
            )}
            <div className="px-4 py-2">
              <LanguageSwitcher />
            </div>
            {!isAuthenticated && (
              <button
                className="block w-full text-left px-4 py-3 text-base font-medium text-gray-600 hover:text-[#466a65] hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => {
                  setIsMenuOpen(false)
                  navigate('/login')
                }}
              >
                {t('auth.login')}
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
