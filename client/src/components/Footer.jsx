import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1A3438] text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* Column 1: Brand & About */}
          <div className="lg:col-span-4">
            <h3 className="text-2xl font-bold text-white mb-4">
              Mann-Mitra
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-xs">
              {t('footer.about.description', 'A comprehensive digital mental health platform connecting students with AI support, professional counsellors, and peer guidance — confidentially and securely.')}
            </p>
            <div className="flex items-center gap-2">
              <span className="w-8 h-1 rounded-full bg-teal-500"></span>
              <span className="w-4 h-1 rounded-full bg-teal-700"></span>
              <span className="w-2 h-1 rounded-full bg-teal-900"></span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5">
              {t('footer.quickLinks.title', 'Quick Links')}
            </h4>
            <ul className="space-y-3">
              {[
                { label: t('footer.quickLinks.home', 'Home'), to: '/' },
                { label: t('footer.quickLinks.screening', 'Screening'), to: '/screening' },
                { label: t('footer.quickLinks.resources', 'Resources'), to: '/resources' },
                { label: t('footer.quickLinks.forum', 'Peer Talk'), to: '/forum' },
                { label: t('footer.quickLinks.booking', 'Book Appointment'), to: '/booking' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-300 hover:text-white text-sm transition-colors duration-200 hover:pl-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5">
              {t('footer.support.title', 'Support')}
            </h4>
            <ul className="space-y-3">
              {[
                { label: t('footer.support.about', 'About Us'), to: '/about' },
                { label: t('footer.support.privacy', 'Privacy Policy'), to: '#privacy' },
                { label: t('footer.support.terms', 'Terms of Service'), to: '#terms' },
                { label: t('footer.support.contact', 'Contact Us'), to: '#contact' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-300 hover:text-white text-sm transition-colors duration-200 hover:pl-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Crisis Support */}
          <div className="lg:col-span-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5">
              Crisis Support
            </h4>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <p className="text-red-400 text-xs font-semibold uppercase tracking-wider">
                Immediate Help Available
              </p>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Suicide Prevention Lifeline</span>
                  <a href="tel:988" className="text-white font-bold text-sm hover:text-teal-300 transition-colors">988</a>
                </div>
                <div className="h-px bg-white/10"></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Crisis Text Line</span>
                  <span className="text-white font-bold text-sm">HOME → 741741</span>
                </div>
                <div className="h-px bg-white/10"></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Emergency Services</span>
                  <a href="tel:911" className="text-white font-bold text-sm hover:text-teal-300 transition-colors">911</a>
                </div>
                <div className="h-px bg-white/10"></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Crisis Email</span>
                  <a href="mailto:crisis@mann-mitra.edu" className="text-white font-bold text-sm hover:text-teal-300 transition-colors">crisis@mann-mitra.edu</a>
                </div>
              </div>

              <p className="text-gray-400 text-xs leading-relaxed pt-2 border-t border-white/10">
                If you are having thoughts of self-harm, please reach out immediately. You are not alone.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
            <p>
              &copy; {currentYear} Mann-Mitra &middot; {t('footer.copyright', 'Mental Health Support Platform. All rights reserved.')}
            </p>
            <p className="text-center md:text-right max-w-md">
              {t('footer.disclaimer', 'This platform is not a substitute for professional medical advice. If you are in crisis, please contact emergency services immediately.')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;