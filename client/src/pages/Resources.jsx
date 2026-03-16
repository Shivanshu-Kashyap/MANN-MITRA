import { useState } from 'react'
import { Link } from 'react-router-dom'

const Resources = () => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [enrolledCourses, setEnrolledCourses] = useState([])

  const categories = [
    { id: 'all', name: 'All Resources', abbr: 'ALL', color: 'bg-teal-500' },
    { id: 'videos', name: 'Videos', abbr: 'VID', color: 'bg-sky-500' },
    { id: 'audios', name: 'Relaxation Audios', abbr: 'AUD', color: 'bg-violet-500' },
    { id: 'guides', name: 'Mental Health Guides', abbr: 'GDE', color: 'bg-amber-500' },
    { id: 'courses', name: 'Training Courses', abbr: 'CRS', color: 'bg-emerald-500' },
    { id: 'certification', name: 'Certification', abbr: 'CRT', color: 'bg-rose-500' }
  ]

  const resources = [
    {
      id: 1, title: "Understanding Mental Health - Hindi",
      description: "Comprehensive guide to mental health awareness in Hindi",
      type: "Video", category: "videos", duration: "15 min",
      language: "Hindi", difficulty: "Beginner", accent: "bg-sky-500"
    },
    {
      id: 2, title: "Coping with Academic Stress",
      description: "Practical strategies for managing study pressure",
      type: "Video", category: "videos", duration: "12 min",
      language: "English", difficulty: "All levels", accent: "bg-sky-500"
    },
    {
      id: 3, title: "5-Minute Meditation - Tamil",
      description: "Quick mindfulness practice in Tamil",
      type: "Audio", category: "audios", duration: "5 min",
      language: "Tamil", difficulty: "Beginner", accent: "bg-violet-500"
    },
    {
      id: 4, title: "Progressive Muscle Relaxation",
      description: "Full body relaxation technique for better sleep",
      type: "Audio", category: "audios", duration: "20 min",
      language: "English", difficulty: "Intermediate", accent: "bg-violet-500"
    },
    {
      id: 5, title: "Nature Sounds for Focus",
      description: "Background sounds to improve concentration",
      type: "Audio", category: "audios", duration: "30 min",
      language: "N/A", difficulty: "All levels", accent: "bg-violet-500"
    },
    {
      id: 6, title: "Student Mental Health Guide",
      description: "Complete handbook for student mental wellness",
      type: "PDF Guide", category: "guides", duration: "30 min read",
      language: "English", difficulty: "All levels", accent: "bg-amber-500"
    },
    {
      id: 7, title: "Anxiety Management Workbook",
      description: "Practical exercises to manage anxiety effectively",
      type: "Interactive Guide", category: "guides", duration: "45 min",
      language: "English", difficulty: "Intermediate", accent: "bg-amber-500"
    },
    {
      id: 8, title: "Peer Support Training Course",
      description: "Become a certified peer volunteer to help other students",
      type: "Training Course", category: "courses", duration: "8 hours",
      language: "English", difficulty: "Advanced", certification: true, accent: "bg-emerald-500"
    },
    {
      id: 9, title: "Mental Health First Aid",
      description: "Learn to recognize and respond to mental health crises",
      type: "Training Course", category: "courses", duration: "6 hours",
      language: "English", difficulty: "Intermediate", certification: true, accent: "bg-emerald-500"
    },
    {
      id: 10, title: "Communication Skills for Support",
      description: "Develop effective listening and support skills",
      type: "Training Course", category: "courses", duration: "4 hours",
      language: "English", difficulty: "Beginner", certification: true, accent: "bg-emerald-500"
    }
  ]

  const certificationPath = [
    { step: 1, title: "Complete Training Modules", description: "Finish required courses" },
    { step: 2, title: "Pass Assessment Test", description: "Score 80% or higher" },
    { step: 3, title: "Counsellor Interview", description: "Professional evaluation" },
    { step: 4, title: "Admin Approval", description: "Final certification approval" },
    { step: 5, title: "Become Peer Volunteer", description: "Start helping other students" }
  ]

  const filteredResources = resources.filter(resource => {
    const matchesCategory = activeCategory === 'all' || resource.category === activeCategory
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const emergencyContacts = [
    { name: "Campus Counseling Center", number: "ext. 2345", hours: "Mon-Fri 9AM-5PM" },
    { name: "24/7 Crisis Helpline", number: "1-800-273-8255", hours: "Available 24/7" },
    { name: "Student Emergency Line", number: "ext. 911", hours: "Available 24/7" }
  ]

  const handleEnrollCourse = (courseId) => {
    if (!enrolledCourses.includes(courseId)) {
      setEnrolledCourses([...enrolledCourses, courseId])
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
      {/* Hero Section */}
      <section className="relative text-center py-16 rounded-2xl overflow-hidden mx-4 mt-4" style={{ backgroundColor: '#F9E6D0' }}>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-teal-800 mb-6">
            Resource Hub
          </h1>
          <p className="text-xl md:text-2xl text-[#2A3F47] mb-8 max-w-3xl mx-auto leading-relaxed">
            Curated videos, relaxation audios, mental health guides, and training courses with certification options
          </p>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Available in multiple regional languages to support your mental wellness journey
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center px-8 py-4 bg-teal-800 text-white font-semibold rounded-xl hover:bg-teal-900 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl">
              Get Recommendations
            </button>
            <button className="inline-flex items-center px-8 py-4 border-2 border-teal-800 text-teal-800 font-semibold rounded-xl hover:bg-teal-800 hover:text-white transform hover:scale-[1.02] transition-all duration-200">
              Start Certification
            </button>
          </div>
        </div>
      </section>

      {/* Search and Categories */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#2A3F47] mb-4">Find Your Perfect Resource</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Search through our curated collection or browse by category
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for videos, guides, courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-teal-800 focus:ring-2 focus:ring-teal-800 focus:ring-opacity-20 transition-all bg-white"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  activeCategory === category.id
                    ? 'bg-teal-800 text-white shadow-lg'
                    : 'bg-white text-[#2A3F47] border border-gray-200 hover:border-teal-800 hover:text-teal-800 shadow-sm'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* AI Recommendations Section */}
      {activeCategory === 'all' && (
        <section className="px-4 py-16" style={{ backgroundColor: '#1A3438' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold tracking-widest text-teal-300 uppercase mb-3">Personalized For You</p>
              <h2 className="text-4xl font-bold text-white mb-4">Smart Recommendations</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Based on your interactions with Buddy and your personal wellness journey
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Stress Relief Audio', desc: 'Recommended based on your recent chat sessions', btn: 'Listen Now', accent: 'bg-violet-500' },
                { title: 'Anxiety Management Guide', desc: 'Popular among students with similar concerns', btn: 'Read Now', accent: 'bg-amber-500' },
                { title: 'Peer Training Course', desc: 'Help others while developing your skills', btn: 'Start Course', accent: 'bg-emerald-500' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1">
                  <div className={`h-1.5 w-full ${item.accent}`}></div>
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-[#2A3F47] mb-3">{item.title}</h3>
                    <p className="text-gray-500 mb-6 text-sm leading-relaxed">{item.desc}</p>
                    <button className="w-full px-6 py-3 bg-teal-800 text-white rounded-xl hover:bg-teal-900 transition-colors font-semibold text-sm">
                      {item.btn}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Certification Path */}
      {activeCategory === 'certification' && (
        <section className="px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl p-8 border border-gray-200 shadow-lg" style={{ backgroundColor: '#F9E6D0' }}>
              <h2 className="text-3xl font-bold text-teal-800 mb-2 text-center">Certification Path</h2>
              <p className="text-lg text-gray-600 text-center mb-8">
                Become a certified peer volunteer to help other students in their mental health journey
              </p>

              <div className="space-y-4">
                {certificationPath.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4 bg-white rounded-xl p-6 shadow-md">
                    <div className="w-10 h-10 bg-teal-800 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#2A3F47] mb-1">{step.title}</h3>
                      <p className="text-gray-500 text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <button className="px-8 py-4 bg-teal-800 text-white rounded-xl hover:bg-teal-900 transition-colors font-semibold text-lg">
                  Start Certification Journey
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#2A3F47] mb-4">Quick Actions</h2>
            <p className="text-lg text-gray-500">Need immediate support? Access these services right away</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { to: '/chat', title: 'Talk to Buddy', desc: 'Get instant AI support and guidance', btn: 'Start Chat',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /> },
              { to: '/booking', title: 'Book Counsellor', desc: 'Schedule a session with a professional', btn: 'Book Now',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
              { to: '/forum', title: 'Peer Support', desc: 'Connect with fellow students', btn: 'Join Forum',
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" /> }
            ].map((action, i) => (
              <Link
                key={i}
                to={action.to}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1"
              >
                <div className="h-1.5 w-full bg-teal-600"></div>
                <div className="p-8 text-center">
                  <div className="text-teal-800 mb-4">
                    <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {action.icon}
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#2A3F47] mb-3">{action.title}</h3>
                  <p className="text-gray-500 text-sm mb-6">{action.desc}</p>
                  <span className="inline-flex items-center px-6 py-3 border-2 border-[#2A3F47] text-[#2A3F47] rounded-xl font-semibold text-sm group-hover:bg-teal-800 group-hover:border-teal-800 group-hover:text-white transition-all duration-200">
                    {action.btn}
                    <svg className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#2A3F47] mb-4">
              {activeCategory === 'all' ? 'All Resources' : categories.find(c => c.id === activeCategory)?.name}
            </h2>
            <p className="text-gray-500">
              {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} available
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1">
                {/* Accent stripe */}
                <div className={`h-1.5 w-full ${resource.accent}`}></div>

                <div className="p-6">
                  {/* Tags row */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                      {resource.type}
                    </span>
                    <div className="flex items-center gap-2">
                      {resource.language && resource.language !== 'N/A' && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                          {resource.language}
                        </span>
                      )}
                      {resource.certification && (
                        <span className="px-3 py-1 text-xs rounded-full font-semibold bg-teal-50 text-teal-800">
                          Certified
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#2A3F47] mb-2 leading-tight">
                    {resource.title}
                  </h3>

                  <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                    {resource.description}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-5">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {resource.duration}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      resource.difficulty === 'Beginner' ? 'bg-emerald-50 text-emerald-700' :
                      resource.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-700' :
                      resource.difficulty === 'Advanced' ? 'bg-rose-50 text-rose-700' :
                      'bg-sky-50 text-sky-700'
                    }`}>
                      {resource.difficulty}
                    </span>
                  </div>

                  {/* Action */}
                  {resource.category === 'courses' ? (
                    enrolledCourses.includes(resource.id) ? (
                      <Link
                        to={`/certification/course/${resource.id}`}
                        className="block w-full text-center px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                      >
                        Continue Learning
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnrollCourse(resource.id)}
                        className="w-full px-4 py-2.5 bg-teal-800 text-white rounded-xl text-sm font-semibold hover:bg-teal-900 transition-colors"
                      >
                        Enroll Now
                      </button>
                    )
                  ) : (
                    <button className="w-full px-4 py-2.5 border-2 border-[#2A3F47] text-[#2A3F47] rounded-xl text-sm font-semibold hover:bg-teal-800 hover:border-teal-800 hover:text-white transition-all duration-200">
                      Access Resource
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#2A3F47] mb-4">No resources found</h3>
              <p className="text-gray-500 mb-8">Try searching with different keywords or select a different category.</p>
              <button
                onClick={() => {
                  setActiveCategory('all')
                  setSearchTerm('')
                }}
                className="px-6 py-3 bg-teal-800 text-white rounded-xl hover:bg-teal-900 transition-colors font-semibold"
              >
                Show All Resources
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="px-4 py-12" style={{ backgroundColor: '#1A3438' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Emergency Support</h2>
          <p className="text-gray-300 mb-8">If you&apos;re experiencing a crisis, reach out immediately</p>

          <div className="grid md:grid-cols-3 gap-6">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
                <h3 className="font-bold text-white mb-2">{contact.name}</h3>
                <p className="text-teal-300 font-semibold text-lg mb-1">{contact.number}</p>
                <p className="text-gray-400 text-sm">{contact.hours}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Resources