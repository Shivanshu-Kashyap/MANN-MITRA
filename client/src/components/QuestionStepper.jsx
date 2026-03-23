import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PHQ9_ANSWERS, AUDIO_URLS } from '../data/phq9'

const QuestionStepper = ({ 
  question, 
  questionNumber, 
  totalQuestions, 
  value, 
  onChange, 
  onNext, 
  onPrevious, 
  isFirst, 
  isLast, 
  error,
  isSubmitting,
  instructionText 
}) => {
  const { t } = useTranslation()
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  const progressPercentage = ((questionNumber - 1) / totalQuestions) * 100

  const handleAudioPlay = async () => {
    try {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          await audioRef.current.play()
          setIsPlaying(true)
        }
      }
    } catch (error) {
      console.error('Audio playback error:', error)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(t(`screening.questions.${question.key}`))
        utterance.lang = 'en-US'
        utterance.rate = 0.8
        speechSynthesis.speak(utterance)
      }
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const handleAnswerChange = (answerValue) => {
    onChange(answerValue)
  }

  const handleNext = () => {
    if (value !== null && value !== undefined) {
      onNext()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key >= '1' && e.key <= '4') {
      const answerIndex = parseInt(e.key) - 1
      if (answerIndex < PHQ9_ANSWERS.length) {
        handleAnswerChange(PHQ9_ANSWERS[answerIndex].value)
      }
    } else if (e.key === 'Enter' && value !== null && value !== undefined) {
      handleNext()
    } else if (e.key === 'ArrowLeft' && !isFirst) {
      onPrevious()
    } else if (e.key === 'ArrowRight' && value !== null && value !== undefined) {
      handleNext()
    }
  }

  return (
    <div 
      className="max-w-4xl mx-auto p-6 focus:outline-none" 
      tabIndex={0} 
      onKeyDown={handleKeyPress}
    >
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-500">
            Progress
          </span>
          <span className="text-sm font-semibold text-teal-800">
            {questionNumber} of {totalQuestions}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-teal-700 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
        <div className="h-1.5 w-full bg-teal-500"></div>
        <div className="p-8">
          {/* Question Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#F9E6D0] rounded-full mb-4">
              <span className="text-teal-800 font-bold text-xl">{questionNumber}</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-[#2A3F47] mb-4 leading-relaxed">
              {question.text || t(`screening.phq9.questions.${question.key}`)}
            </h2>
            
            <p className="text-lg text-gray-500 mb-6">
              {instructionText}
            </p>

            {/* Audio Playback Button */}
            <div className="flex justify-center mb-6">
              <button
                type="button"
                onClick={handleAudioPlay}
                className="inline-flex items-center px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-700 text-sm font-medium"
                aria-label={isPlaying ? 'Pause Audio' : 'Play Audio'}
              >
                {isPlaying ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                    </svg>
                    Pause Audio
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8 21l4-4H8a2 2 0 01-2-2V9a2 2 0 012-2h4l4-4v18z" />
                    </svg>
                    Play Audio
                  </>
                )}
              </button>
            </div>

            {/* Hidden Audio Element */}
            <audio
              ref={audioRef}
              src={AUDIO_URLS[question.audioId]}
              onEnded={handleAudioEnded}
              preload="none"
            />
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {PHQ9_ANSWERS.map((answer, index) => (
              <label
                key={answer.value}
                className={`relative flex items-center p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  value === answer.value
                    ? 'border-teal-700 bg-teal-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={answer.value}
                  checked={value === answer.value}
                  onChange={() => handleAnswerChange(answer.value)}
                  className="sr-only"
                />
                
                {/* Custom Radio Button */}
                <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mr-4 transition-colors flex items-center justify-center ${
                  value === answer.value
                    ? 'border-teal-700 bg-teal-700'
                    : 'border-gray-300'
                }`}>
                  {value === answer.value && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>

                {/* Keyboard Shortcut */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mr-4 text-xs font-semibold ${
                  value === answer.value
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {index + 1}
                </div>

                {/* Answer Text */}
                <div className="flex-1">
                  <span className={`text-base font-medium ${
                    value === answer.value ? 'text-teal-900' : 'text-[#2A3F47]'
                  }`}>
                    {answer.label || t(`screening.phq9.answers.${answer.value}`)}
                  </span>
                </div>

                {/* Selection Indicator */}
                {value === answer.value && (
                  <div className="flex-shrink-0 text-teal-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-rose-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-rose-700 text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirst}
          className={`inline-flex items-center px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
            isFirst
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-[#2A3F47] hover:bg-white hover:shadow-sm'
          }`}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <div className="text-center hidden sm:block">
          <p className="text-xs text-gray-400 mb-1">
            Keyboard Shortcuts
          </p>
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
            <span>1-4: Select Option</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>Enter: Next</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>←→: Navigate</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={value === null || value === undefined || (isLast && isSubmitting)}
          className={`inline-flex items-center px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
            value !== null && value !== undefined && !(isLast && isSubmitting)
              ? 'bg-teal-800 text-white hover:bg-teal-900 shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLast && isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Completing...
            </>
          ) : (
            isLast ? 'Submit' : 'Next'
          )}
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Instructions Footer */}
      <div className="mt-8 text-center">
        <div className="rounded-xl p-4 border border-gray-200" style={{ backgroundColor: '#F9E6D0' }}>
          <p className="text-[#2A3F47] text-sm">
            <strong>Important:</strong> This screening tool is not a substitute for professional clinical advice, diagnosis, or treatment.
          </p>
        </div>
      </div>
    </div>
  )
}

export default QuestionStepper