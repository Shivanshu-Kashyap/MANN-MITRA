import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import image1 from '../assets/Illustration_1.png'
import image2 from '../assets/Illustration_2.png'
import image3 from '../assets/illustration_6.png'
import image4 from '../assets/Illustration_10.png'
import image5 from '../assets/illustration.png'

const Home = () => {
  const { t } = useTranslation()

  const screeningHighlights = [
    'Validated PHQ-9 questions used for early depression screening',
    'Takes only a few minutes and gives a clear severity snapshot',
    'Helps you decide whether to continue with Buddy or book a counsellor'
  ]

  const chatBenefits = [
    {
      title: 'Always available',
      description: 'Immediate emotional support any time of day.'
    },
    {
      title: 'Grounded guidance',
      description: 'Helpful coping strategies, reflection prompts, and next steps.'
    },
    {
      title: 'Private by design',
      description: 'A calm, judgment-free space before you are ready for live care.'
    }
  ]

  const features = [
    {
      key: 'buddy',
      title: 'Buddy',
      // The description from the image is shorter
      description: 'An AI-powered, voice-enabled chatbot offering confidential mental health first aid in multiple regional languages.',
      path: '/chat',
      bgColor: '#F9E6D0'
    },
    {
      key: 'resources',
      title: 'Resource Hub',
      description: 'Videos, relaxation audios, guides, and courses with certification option. Curated content in multiple languages.',
      path: '/resources',
      bgColor: '#FFFFFF'
    },
    {
      key: 'peer',
      title: 'Peer Talk',
      // The description from the image is longer and has two paragraphs
      description: 'Anonymously connect with fellow students in a safe, moderated space. Share experiences and find support from a community that understands. Our discussions are guided by trained peer supporters to ensure conversations are always constructive and empathetic.',
      path: '/forum',
      bgColor: '#FFFFFF'
    },
    {
      key: 'counsellor',
      title: 'Counsellor Talk',
      description: 'Book online chat, video call, or online sessions with professional counsellors. Confidential and secure.',
      path: '/booking',
      bgColor: '#F9E6D0'
    }
];

const featuresData = [
    {
        title: 'Verified Anonymity',
        description: 'Verify your student status with your college ID. You will be anonymous to all peers. Your identity is held confidentially by an admin for emergency situations only.',
        buttonText: 'Explore',
        buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
    },
    {
        title: 'Smart First-Aid Chatbot',
        description: 'Get instant support and severity assessment from our AI, with direct referrals to counsellors for serious cases.',
        buttonText: 'Explore',
        buttonColor: 'bg-teal-400 hover:bg-teal-500',
    },
    {
        title: 'Secure Appointments',
        description: 'Privately book online or in-person sessions with our professional counsellors. All bookings are strictly confidential.',
        buttonText: 'Explore',
        buttonColor: 'bg-pink-300 hover:bg-pink-400',
    },
    {
        title: 'Guided Peer Support',
        description: 'Share issues anonymously in our safe, filtered forum. Trained peers provide guidance and help maintain a supportive, judgment-free environment.',
        buttonText: 'Explore',
        buttonColor: 'bg-[#2A3F47] hover:bg-[#1E2D33] text-white', // Dark teal/charcoal button
    },
    {
        title: 'Learn & Get Certified',
        description: 'Access a library of wellness guides, audios, and videos. Complete our training pathways to earn your certificate and volunteer as a peer supporter.',
        buttonText: 'Explore',
        buttonColor: 'bg-orange-400 hover:bg-orange-500',
    },
    {
        title: 'Centralized Admin Portal',
        description: 'Manage counsellors, certify student volunteers, and view anonymous wellness analytics and reports from a single, secure interface.',
        buttonText: 'Explore',
        buttonColor: 'bg-blue-500 hover:bg-blue-600',
    },
];


  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative text-center py-16 rounded-2xl overflow-hidden" style={{ backgroundColor: '#F9E6D0' }}>
        {/* Image 1 - Right Corner */}
        <img
          src={image1}
          alt="Illustration 1"
          className="absolute top-0 right-0 h-124 w-auto z-0"
        />
        {/* Image 2 - Left Corner */}
        <img
          src={image2}
          alt="Illustration 2"
          className="absolute bottom-0 left-0 h-124 w-auto z-0"
        />

        <div className="max-w-4xl mx-auto px-6 relative z-10"> {/* Added relative z-10 to ensure text is above images */}
          <h1 className="text-5xl md:text-7xl font-bold text-teal-800 mb-6">
            Mann-Mitra
          </h1>
          <p className="text-xl md:text-2xl text-teal-800 mb-8 max-w-3xl mx-auto leading-relaxed">
            Digital psychological support for students - Stress-free, stigma-free, accessible mental health solution
          </p>
          <p className="text-lg text-[#404040] mb-10 max-w-2xl mx-auto">
            Your trusted companion for mental wellness, connecting you with AI support, professional counsellors, peer guidance, and curated resources
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/chat"
              className="inline-flex items-center px-8 py-4 bg-teal-800 text-white font-semibold rounded-xl hover:bg-teal-900 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Talk To Buddy
            </Link>
            <Link
              to="/booking"
              className="inline-flex items-center px-8 py-4 bg-teal-800 text-white font-semibold rounded-xl hover:bg-teal-900 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Book Counsellor
            </Link>
          </div>
        </div>
      </section>
      <section className="relative grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden" > {/* Removed shadow-lg */}
    {/* Left Section - Text Content with light gray background to mimic the image */}
    <div className="p-12 flex flex-col justify-center bg-gray-100/70"> {/* Changed to light gray for the section's background color */}
        <p className="text-sm font-semibold text-gray-600 mb-2">HOW IT WORKS</p>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            We Help You<br />Prioritize Your<br />Mental Health
        </h2>
        <p className="text-lg text-gray-700 mb-8 max-w-md">
            Book online chat, video call, or online sessions with professional counsellors.
            Confidential and Secure
        </p>
        <Link
            to="/booking"
            className="inline-flex items-center px-8 py-4 bg-teal-800 text-white font-semibold rounded-xl hover:bg-teal-900 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl w-fit"
        >
            Counsellor Talk
        </Link>
    </div>

    {/* Right Section - Image without a dark green background, reduced vertical space, and NO background color */}
    <div className="relative bg-[#1A3438] flex items-center justify-center p-8"> {/* No explicit background color */}
        <img
            src={image5}
            alt="Illustration of a person with complex thoughts"
            className="max-w-xs h-auto object-contain"
        />
    </div>
</section>

      <section className="relative overflow-hidden rounded-[2rem] border border-[#D7E6E4] bg-white shadow-[0_30px_80px_rgba(26,52,56,0.08)]">
        <div className="absolute inset-y-0 left-0 w-1/3 bg-[radial-gradient(circle_at_top_left,_rgba(42,63,71,0.12),_transparent_70%)]"></div>
        <div className="relative grid gap-8 px-6 py-10 md:grid-cols-[1.05fr_0.95fr] md:px-10 md:py-14">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit rounded-full bg-[#E6F3F1] px-4 py-2 text-sm font-semibold text-teal-800">
              Quick Self-Check
            </span>
            <h2 className="max-w-xl text-4xl font-bold leading-tight text-[#2A3F47] md:text-5xl">
              Start the PHQ-9 screening directly from home
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">
              If you want a quick sense of how you have been feeling lately, take the PHQ-9 assessment first. It is a simple, research-backed screening that helps you understand your current mental health state and choose the right next step.
            </p>

            <div className="mt-8 space-y-4">
              {screeningHighlights.map((item) => (
                <div key={item} className="flex items-start gap-4 rounded-2xl bg-[#F9F7F4] px-4 py-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D9F3E6] text-[#1E8A57]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-base font-medium leading-relaxed text-[#2A3F47]">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/screening"
                className="inline-flex items-center justify-center rounded-xl bg-teal-800 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:bg-teal-900 hover:shadow-xl"
              >
                Take PHQ-9 Screening
              </Link>
              <Link
                to="/screenings/history"
                className="inline-flex items-center justify-center rounded-xl border-2 border-[#C8D5D8] px-8 py-4 font-semibold text-[#2A3F47] transition-colors duration-200 hover:border-teal-700 hover:text-teal-700"
              >
                View Screening History
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#F6FBFA] p-5 md:p-7">
            <div className="rounded-[1.75rem] border border-[#D7E6E4] bg-white p-6 shadow-[0_20px_50px_rgba(42,63,71,0.08)]">
              <div className="flex items-center justify-between border-b border-[#E6EFEF] pb-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Assessment</p>
                  <h3 className="mt-2 text-2xl font-bold text-[#2A3F47]">PHQ-9 overview</h3>
                </div>
                <div className="rounded-2xl bg-[#EAF4F2] px-4 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Duration</p>
                  <p className="mt-1 text-lg font-bold text-[#2A3F47]">2 to 3 min</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#F9F7F4] p-5">
                  <p className="text-sm font-semibold text-teal-700">What it checks</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Mood, motivation, sleep, energy, concentration, and other symptoms from the last two weeks.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F4F8FB] p-5">
                  <p className="text-sm font-semibold text-teal-700">What happens next</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    You get a score summary, guidance, and direct paths to Buddy or professional help.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-[#1A3438] p-5 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">Support path</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium">
                  <span className="rounded-full bg-white/10 px-4 py-2">Start screening</span>
                  <span className="text-teal-200">→</span>
                  <span className="rounded-full bg-white/10 px-4 py-2">Review your score</span>
                  <span className="text-teal-200">→</span>
                  <span className="rounded-full bg-white/10 px-4 py-2">Choose chat or counselling</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-2 gap-8">
    {/* The grid will display all four features in two rows */}
    {features.map((feature) => (
        <Link
            key={feature.key}
            to={feature.path}
            // Apply the custom background color using inline style
            style={{ backgroundColor: feature.bgColor }}
            // Use classes for border, rounded corners, shadow, and hover effects
            className={`group p-8 rounded-2xl border transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl ${feature.bgColor === '#FFFFFF' ? 'shadow-md border-gray-100' : 'shadow-lg border-transparent'}`}
        >
            <div className="flex flex-col h-full"> {/* Use flex-col and h-full to push the button to the bottom */}
                {/* Text Content */}
                <div className="flex-1">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-700 leading-relaxed">
                        {/* Split the Peer Talk description into two parts if it contains the second sentence */}
                        {feature.key === 'peer' && feature.description.split('. ').length > 1 
                            ? (
                                <>
                                    {feature.description.split('. ')[0]}.<br/><br/>
                                    {feature.description.split('. ').slice(1).join('. ')}
                                </>
                            )
                            : feature.description
                        }
                    </p>
                </div>

                {/* Learn More Button - Styled to match the image */}
                <div className="mt-8"> {/* Added margin-top to separate button from text */}
                    <button className={`inline-flex items-center px-6 py-3 text-base font-semibold rounded-xl border-2 transition-colors duration-200 
                        ${feature.bgColor === '#FFFFFF' 
                            ? 'bg-transparent border-gray-400 text-gray-800 hover:border-teal-700 hover:text-teal-700' 
                            : 'bg-transparent border-gray-700 text-gray-700 hover:border-teal-700 hover:text-teal-700'
                        }`}
                    >
                        Learn More
                    </button>
                </div>
            </div>
            {/* Note: Illustrations/icons are not included as they require separate image components. */}
        </Link>
    ))}
</section>

      <section className="relative overflow-hidden rounded-[2rem] bg-[#F9F7F4] px-6 py-12 md:px-10 md:py-16">
        <div className="absolute -left-12 bottom-6 h-40 w-40 rounded-full bg-teal-100/70 blur-2xl"></div>
        <div className="absolute -right-10 top-8 h-36 w-36 rounded-full bg-sky-100/60 blur-2xl"></div>

        <div className="relative grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="inline-flex rounded-full bg-[#EAF4F2] px-4 py-2 text-sm font-semibold text-teal-800">
              AI-Powered Support
            </span>
            <h2 className="mt-5 text-4xl font-bold leading-tight text-[#2A3F47] md:text-5xl">
              24/7 Buddy chat support that feels calm, private, and immediate
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-600">
              Talk to Buddy whenever you need a steady first response. The experience is designed for quick emotional check-ins, gentle coping support, and a smooth handoff to counsellors when needed.
            </p>

            <div className="mt-8 space-y-5">
              {chatBenefits.map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D9F3E6] text-[#1E8A57]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-[#2A3F47]">{item.title}</p>
                    <p className="mt-1 text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/chat"
                className="inline-flex items-center justify-center rounded-xl bg-teal-800 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:bg-teal-900 hover:shadow-xl"
              >
                Start Chat Now
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center rounded-xl border-2 border-[#C8D5D8] px-8 py-4 font-semibold text-[#2A3F47] transition-colors duration-200 hover:border-teal-700 hover:text-teal-700"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-[#D7E6E4] bg-white p-5 shadow-[0_28px_70px_rgba(26,52,56,0.12)]">
              <div className="flex items-center justify-between border-b border-[#E6EFEF] pb-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-800 text-white">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#2A3F47]">Buddy Support</h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-[#4AA35A]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#4AA35A]"></span>
                      Online now
                    </div>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF4F8] text-[#94A3B8]">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.8" />
                    <circle cx="12" cy="12" r="1.8" />
                    <circle cx="12" cy="19" r="1.8" />
                  </svg>
                </div>
              </div>

              <div className="space-y-5 py-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF4F2] text-teal-800">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z" />
                    </svg>
                  </div>
                  <div className="max-w-[78%] rounded-[1.25rem] rounded-tl-md bg-[#F3F5F8] px-5 py-4 text-[#2A3F47] shadow-sm">
                    <p className="text-lg leading-8">
                      Hello! I&apos;m here to support you. How are you feeling today?
                    </p>
                    <p className="mt-2 text-sm text-gray-400">Just now</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="max-w-[72%] rounded-[1.25rem] rounded-tr-md bg-teal-700 px-5 py-4 text-white shadow-sm">
                    <p className="text-lg leading-8">
                      I&apos;m feeling anxious about an upcoming presentation tomorrow.
                    </p>
                    <p className="mt-2 text-sm text-teal-100">Just now</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF4F2] text-teal-800">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z" />
                    </svg>
                  </div>
                  <div className="max-w-[82%] rounded-[1.25rem] rounded-tl-md bg-[#F3F5F8] px-5 py-4 text-[#2A3F47] shadow-sm">
                    <p className="text-lg leading-8">
                      That sounds overwhelming. Let&apos;s slow it down together with one small step. Would you like a 30-second grounding exercise or a quick prep plan?
                    </p>
                    <p className="mt-2 text-sm text-gray-400">Just now</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E6EFEF] pt-5">
                <div className="flex items-center gap-3 rounded-2xl border border-[#D6DFE5] px-4 py-4">
                  <input
                    type="text"
                    value=""
                    readOnly
                    placeholder="Type your message..."
                    className="w-full bg-transparent text-base text-[#2A3F47] placeholder:text-gray-400 focus:outline-none"
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF4F2] text-teal-800">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Flow Section */}
      <section className="py-16 md:py-24">
    {/* Header Section */}
    <div className="max-w-4xl mx-auto text-center mb-16">
        <p className="text-sm font-semibold tracking-widest text-teal-700 uppercase mb-3">
            EXPLORE & LEARN
        </p>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[#2A3F47] mb-6 leading-tight">
            Resources for<br />Your Well-being
        </h2>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Explore expert insights, self-care guides, and tools to support your mental health.
        </p>
    </div>

    {/* Features Grid: Premium cards with accent stripe */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {featuresData.map((feature, index) => {
            const accents = [
              'bg-amber-400',
              'bg-teal-500',
              'bg-rose-400',
              'bg-[#2A3F47]',
              'bg-orange-400',
              'bg-sky-500',
            ]
            return (
            <div
                key={index}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 flex flex-col"
            >
                {/* Accent stripe top */}
                <div className={`h-1.5 w-full ${accents[index % accents.length]}`}></div>
                
                <div className="p-8 flex flex-col flex-1">
                    {/* Step number */}
                    <div className="flex items-center gap-3 mb-5">
                        <span className={`w-9 h-9 rounded-lg ${accents[index % accents.length]} flex items-center justify-center text-white text-sm font-bold`}>
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-xl font-bold text-[#2A3F47]">
                            {feature.title}
                        </h3>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-500 leading-relaxed flex-grow mb-6 text-sm">
                        {feature.description}
                    </p>
                    
                    {/* Explore Button */}
                    <button
                        className="inline-flex items-center justify-center px-6 py-3 font-semibold rounded-xl border-2 border-[#2A3F47] text-[#2A3F47] bg-transparent hover:bg-teal-800 hover:border-teal-800 hover:text-white shadow-sm transition-all duration-200 w-full group-hover:shadow-md"
                    >
                        {feature.buttonText}
                        <svg className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        )})}
    </div>
</section>
    </div>
  )
}

export default Home
