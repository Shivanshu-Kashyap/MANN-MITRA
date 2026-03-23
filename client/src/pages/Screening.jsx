import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'
import QuestionStepper from '../components/QuestionStepper'
import CrisisModal from '../components/CrisisModal'
import { phq9Questions, calculatePHQ9Score, interpretPHQ9Score, checkCrisisRisk } from '../data/phq9'
import { useApi } from '../utils/api'

const Screening = () => {
  const { t } = useTranslation()
  const { post, screening } = useApi()
  const [currentStep, setCurrentStep] = useState('intro') // 'intro', 'screening', 'complete'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [crisisModal, setCrisisModal] = useState({ isOpen: false, type: null })
  const [screeningResult, setScreeningResult] = useState(null)
  const [isSubmittingScreening, setIsSubmittingScreening] = useState(false)

  const validationSchema = Yup.object().shape(
    phq9Questions.reduce((schema, _, index) => {
      schema[`q${index + 1}`] = Yup.number()
        .required('This question is required')
        .min(0, 'Please select a valid answer')
        .max(3, 'Please select a valid answer')
      return schema
    }, {})
  )

  const initialValues = phq9Questions.reduce((values, _, index) => {
    values[`q${index + 1}`] = null
    return values
  }, {})

  const handleSubmitScreening = async (values, { setSubmitting }) => {
    try {
      const answers = Object.values(values)
      const score = calculatePHQ9Score(answers)
      const interpretation = interpretPHQ9Score(score)
      const crisisRisk = checkCrisisRisk(answers)

      const screeningData = {
        tool: 'PHQ-9',
        responses: answers,
        score,
        interpretation,
        crisisRisk,
        completedAt: new Date().toISOString()
      }

      // Submit to API using the screening endpoint
      await screening.createScreening(screeningData)

      setScreeningResult({ score, interpretation, crisisRisk })

      // Handle crisis situations
      if (crisisRisk.level === 'immediate') {
        setCrisisModal({ isOpen: true, type: 'immediate' })
      } else if (crisisRisk.level === 'elevated') {
        setCrisisModal({ isOpen: true, type: 'escalation' })
      } else {
        setCurrentStep('complete')
      }
    } catch (error) {
      console.error('Error submitting screening:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleContactCounselor = async () => {
    try {
      await post('/crisis/contact-counselor', {
        urgency: crisisModal.type,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error contacting counselor:', error)
    }
  }

  const handleCrisisModalClose = () => {
    setCrisisModal({ isOpen: false, type: null })
    setCurrentStep('complete')
  }

  const getSeverityColor = (severity) => {
    const s = severity?.toLowerCase()
    if (s?.includes('minimal') || s?.includes('none')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' }
    if (s?.includes('mild')) return { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' }
    if (s?.includes('moderate')) return { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-200' }
    if (s?.includes('severe')) return { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', border: 'border-rose-200' }
    return { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500', border: 'border-gray-200' }
  }

  // Screening step
  if (currentStep === 'screening') {
    const currentQuestion = phq9Questions[currentQuestionIndex]
    const fieldName = `q${currentQuestionIndex + 1}`
    
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmitScreening}
        >
          {({ values, setFieldValue, isSubmitting, errors, touched }) => {
            const handleNext = async () => {
              if (currentQuestionIndex < phq9Questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1)
              } else {
                setIsSubmittingScreening(true)
                try {
                  await handleSubmitScreening(values, { setSubmitting: setIsSubmittingScreening })
                } finally {
                  setIsSubmittingScreening(false)
                }
              }
            }

            const handlePrevious = () => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1)
              }
            }

            const handleAnswerChange = (value) => {
              setFieldValue(fieldName, value)
            }

            return (
              <Form>
                <QuestionStepper
                  question={currentQuestion}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={phq9Questions.length}
                  value={values[fieldName]}
                  onChange={handleAnswerChange}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  isFirst={currentQuestionIndex === 0}
                  isLast={currentQuestionIndex === phq9Questions.length - 1}
                  error={touched[fieldName] && errors[fieldName]}
                  isSubmitting={isSubmittingScreening}
                  instructionText="Over the last 2 weeks, how often have you been bothered by any of the following problems?"
                />
              </Form>
            )
          }}
        </Formik>

        <CrisisModal
          isOpen={crisisModal.isOpen}
          onClose={handleCrisisModalClose}
          crisisType={crisisModal.type}
          onContactCounselor={handleContactCounselor}
        />
      </div>
    )
  }

  // Completion step
  if (currentStep === 'complete') {
    const severityColors = screeningResult ? getSeverityColor(screeningResult.interpretation.severity) : null

    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#F9F7F4' }}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden text-center">
            <div className="h-1.5 w-full bg-teal-500"></div>
            <div className="p-8">
              <div className="w-16 h-16 bg-[#F9E6D0] rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-teal-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#2A3F47] mb-2">
                Screening Complete
              </h2>
              <p className="text-gray-500 mb-8">
                Thank you for completing the mental health screening. Your results have been saved.
              </p>
              
              {screeningResult && (
                <div className={`${severityColors.bg} border ${severityColors.border} rounded-2xl p-6 mb-8 text-left`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-lg font-semibold ${severityColors.text}`}>
                      Your Result
                    </h3>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${severityColors.bg} ${severityColors.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${severityColors.dot}`}></span>
                      {screeningResult.interpretation.severity}
                    </span>
                  </div>
                  <p className={`${severityColors.text} text-sm mb-3`}>
                    {screeningResult.interpretation.description}
                  </p>
                  <p className="text-[#2A3F47] text-sm">
            <strong>Important:</strong> This screening tool is not a substitute for professional clinical advice, diagnosis, or treatment.
          </p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">PHQ-9 Score</span>
                    <span className={`text-sm font-semibold ${severityColors.text}`}>
                      {screeningResult.score}/27
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setCurrentStep('intro')
                    setCurrentQuestionIndex(0)
                    setScreeningResult(null)
                  }}
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Take Another Screening
                </button>
                <Link
                  to="/resources"
                  className="px-6 py-3 bg-teal-800 text-white rounded-xl font-medium hover:bg-teal-900 transition-colors"
                >
                  View Resources
                </Link>
                <Link
                  to="/booking"
                  className="px-6 py-3 border-2 border-teal-800 text-teal-800 rounded-xl font-medium hover:bg-teal-800 hover:text-white transition-all"
                >
                  Book Counsellor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default intro screen
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
      {/* Hero Section */}
      <section className="relative text-center py-16 rounded-2xl overflow-hidden mx-4 mt-4" style={{ backgroundColor: '#F9E6D0' }}>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-teal-800 mb-6">
            Mental Health Screening
          </h1>
          <p className="text-xl md:text-2xl text-[#2A3F47] mb-4 max-w-3xl mx-auto leading-relaxed">
            Take the scientifically validated PHQ-9 assessment
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            A standardized, clinically-validated assessment to help you understand your mental wellness
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* PHQ-9 Card */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
            <div className="h-1.5 w-full bg-teal-500"></div>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-[#F9E6D0] rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-teal-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#2A3F47] mb-2">
                Patient Health Questionnaire (PHQ-9)
              </h2>
              <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
                Please answer the following questions based on how you have been feeling over the last 2 weeks.
              </p>
              
              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  {
                    title: 'Confidential',
                    desc: 'Your responses are secure and private',
                    accent: 'bg-teal-500',
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  },
                  {
                    title: 'Quick',
                    desc: 'Takes only 5-10 minutes to complete',
                    accent: 'bg-amber-500',
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  },
                  {
                    title: 'Insightful',
                    desc: 'Get personalized recommendations',
                    accent: 'bg-sky-500',
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  }
                ].map((feature, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                    <div className={`h-1.5 w-full ${feature.accent}`}></div>
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-teal-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {feature.icon}
                        </svg>
                      </div>
                      <h3 className="font-bold text-[#2A3F47] mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-500">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentStep('screening')}
                className="inline-flex items-center px-8 py-4 bg-teal-800 text-white font-semibold rounded-xl hover:bg-teal-900 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Screening
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* How It Works */}
          <div className="rounded-2xl p-8 border border-gray-200" style={{ backgroundColor: '#F9E6D0' }}>
            <h3 className="text-xl font-bold text-[#2A3F47] mb-6 text-center">How The Screening Works</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {[
                { step: '01', title: 'Answer Questions', desc: 'Respond to 9 clinically-validated questions' },
                { step: '02', title: 'Get Your Score', desc: 'Receive an assessment of your current state' },
                { step: '03', title: 'View Resources', desc: 'Access tailored support recommendations' },
                { step: '04', title: 'Take Action', desc: 'Connect with counsellors if needed' }
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="text-xs font-bold text-teal-700 mb-2">{item.step}</div>
                  <div className="font-medium text-[#2A3F47] mb-1">{item.title}</div>
                  <div className="text-gray-500 text-xs">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Screening