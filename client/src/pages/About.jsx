import { Link } from 'react-router-dom'

const About = () => {
  const features = [
    {
      title: "Stress-Free Access",
      description: "No lengthy forms or complex procedures. Access support with just a few clicks.",
      accent: "bg-teal-500"
    },
    {
      title: "Stigma-Free Environment",
      description: "Anonymous registration and interactions ensure complete privacy and comfort.",
      accent: "bg-amber-500"
    },
    {
      title: "Comprehensive Support",
      description: "From AI chatbot to professional counsellors, peer support, and curated resources.",
      accent: "bg-sky-500"
    },
    {
      title: "Regional Language Support",
      description: "Communicate in your preferred language for better understanding and comfort.",
      accent: "bg-violet-500"
    }
  ]

  const team = [
    {
      name: "Dr. Priya Sharma",
      role: "Clinical Psychologist",
      qualification: "Ph.D. Clinical Psychology, AIIMS",
      focus: "Student mental health and crisis intervention",
      initials: "PS"
    },
    {
      name: "Rajesh Kumar",
      role: "Lead Developer",
      qualification: "M.Tech Computer Science, IIT Delhi",
      focus: "AI/ML and secure platform development",
      initials: "RK"
    },
    {
      name: "Meera Patel",
      role: "Peer Support Coordinator",
      qualification: "M.A. Psychology, Jamia Millia",
      focus: "Training student volunteers and community building",
      initials: "MP"
    }
  ]

  const stats = [
    { number: "25,000+", label: "Students helped" },
    { number: "500+", label: "Trained peer volunteers" },
    { number: "50+", label: "Partner colleges" },
    { number: "95%", label: "Satisfaction rate" }
  ]

  const values = [
    {
      title: "Empathy First",
      description: "Every interaction is guided by genuine care and understanding.",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    },
    {
      title: "Trust & Safety",
      description: "Your privacy and safety are never compromised.",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    },
    {
      title: "Always Improving",
      description: "We continuously evolve based on student needs and feedback.",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
      {/* Hero Section */}
      <section className="relative text-center py-20 rounded-2xl overflow-hidden mx-4 mt-4" style={{ backgroundColor: '#F9E6D0' }}>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-teal-800 mb-6">
            About Mann-Mitra
          </h1>
          <p className="text-xl md:text-2xl text-[#2A3F47] mb-4 max-w-3xl mx-auto leading-relaxed">
            Digital psychological support for students — your trusted companion for mental wellness
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We provide stress-free, stigma-free, and accessible mental health solutions designed specifically for students.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-sm font-semibold tracking-widest text-teal-700 uppercase mb-3">Our Purpose</p>
              <h2 className="text-3xl font-bold text-[#2A3F47] mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                To break down barriers to mental health support for students by providing comprehensive,
                accessible, and stigma-free psychological assistance through technology and human connection.
              </p>
              <p className="text-gray-500 mb-8 leading-relaxed">
                We believe every student should have access to mental health resources without fear of judgment,
                financial constraints, or social stigma. Our platform combines AI-powered immediate support
                with human expertise, peer connections, and culturally sensitive resources designed
                specifically for the Indian student experience.
              </p>
              <Link
                to="/chat"
                className="inline-flex items-center bg-teal-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-900 transition-all shadow-lg hover:shadow-xl group"
              >
                Experience Our Platform
                <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
              <h3 className="text-xl font-bold text-[#2A3F47] mb-6">Why We Started</h3>
              <div className="space-y-4">
                {[
                  '1 in 4 Indian students experience mental health challenges',
                  'Most wait months or never seek help due to stigma',
                  "Existing services aren't designed for student life",
                  'Crisis situations need immediate, always-available support'
                ].map((point, i) => (
                  <div key={i} className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-600">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold tracking-widest text-teal-700 uppercase mb-3">Our Approach</p>
            <h2 className="text-3xl font-bold text-[#2A3F47]">What Makes Us Different</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`h-1.5 w-full ${feature.accent}`}></div>
                <div className="p-6">
                  <div className="text-xs font-bold text-gray-400 mb-3">0{index + 1}</div>
                  <h3 className="font-bold text-[#2A3F47] mb-3">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4" style={{ backgroundColor: '#1A3438' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold tracking-widest text-teal-300 uppercase mb-3">By The Numbers</p>
            <h2 className="text-3xl font-bold text-white">Our Impact</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-teal-200 font-medium text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold tracking-widest text-teal-700 uppercase mb-3">The People</p>
            <h2 className="text-3xl font-bold text-[#2A3F47]">Meet Our Team</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="h-1.5 w-full bg-teal-500"></div>
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#F9E6D0] rounded-full flex items-center justify-center mx-auto mb-5">
                    <span className="text-lg font-bold text-teal-800">{member.initials}</span>
                  </div>
                  <h3 className="font-bold text-[#2A3F47] text-lg mb-1">{member.name}</h3>
                  <p className="text-teal-700 font-semibold text-sm mb-3">{member.role}</p>
                  <p className="text-sm text-gray-500 mb-2">{member.qualification}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{member.focus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4" style={{ backgroundColor: '#F9E6D0' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold tracking-widest text-teal-700 uppercase mb-3">What We Stand For</p>
            <h2 className="text-3xl font-bold text-[#2A3F47]">Our Core Values</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-md text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {value.icon}
                  </svg>
                </div>
                <h3 className="font-bold text-[#2A3F47] mb-3">{value.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA Section */}
      <section className="py-16 px-4" style={{ backgroundColor: '#1A3438' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Questions About Our Platform?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            We&apos;re here to help. Reach out to learn more about how Mann-Mitra can support your college community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/chat"
              className="bg-teal-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-teal-500 transition-all shadow-lg hover:shadow-xl"
            >
              Try Our Platform
            </Link>
            <a
              href="mailto:hello@Mann-Mitra.edu"
              className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-all"
            >
              Contact Us
            </a>
          </div>

          <div className="pt-8 border-t border-white/10">
            <p className="text-sm text-gray-400">
              <strong className="text-gray-300">For Institutions:</strong> Interested in implementing Mann-Mitra at your college?
              We provide training, support, and customization for institutional partnerships.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About