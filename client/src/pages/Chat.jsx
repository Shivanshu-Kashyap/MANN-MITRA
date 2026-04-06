import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { io } from 'socket.io-client'
import { useApi } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import CrisisModal from '../components/CrisisModal'

const RISK_COLORS = {
  low: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
  critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' },
}

const Chat = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [severityLevel, setSeverityLevel] = useState(null)
  const [showCounsellorSuggestion, setShowCounsellorSuggestion] = useState(false)
  const { post } = useApi()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [buddyAgentConnected, setBuddyAgentConnected] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [crisisModal, setCrisisModal] = useState({ isOpen: false, type: null })
  const [isPlaying, setIsPlaying] = useState({})
  const [riskLevel, setRiskLevel] = useState('low')
  const [riskScore, setRiskScore] = useState(0)
  const [counsellorRec, setCounsellorRec] = useState(null)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)
  const inputRef = useRef(null)

  // Initialize socket connection
  useEffect(() => {
    const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
    
    socketRef.current = io(socketURL, {
      transports: ['websocket'],
      autoConnect: true
    })

    const socket = socketRef.current

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to chat server')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from chat server')
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    // Message event handlers
    socket.on('message', (data) => {
      const newMessage = {
        id: Date.now() + Math.random(),
        text: data.message,
        sender: 'bot',
        timestamp: new Date(),
        suggestedActions: data.suggestedActions || []
      }
      
      setMessages(prev => [...prev, newMessage])
      setIsTyping(false)

      // Handle crisis escalation
      if (data.suggestedActions?.includes('crisis_escalation')) {
        setCrisisModal({ isOpen: true, type: 'escalation' })
      }
    })

    socket.on('typing', () => {
      setIsTyping(true)
    })

    socket.on('stop_typing', () => {
      setIsTyping(false)
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
      const errorMessage = {
        id: Date.now(),
        text: t('chat.connectionError'),
        sender: 'system',
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    })

    // Cleanup on unmount
    return () => {
      socket.disconnect()
    }
  }, [t])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Check buddy agent health on mount and periodically
  useEffect(() => {
    const checkBuddyHealth = async () => {
      try {
        const buddyAgentUrl = import.meta.env.VITE_BUDDY_AGENT_URL || 'http://localhost:8000'
        const response = await fetch(`${buddyAgentUrl}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        })
        setBuddyAgentConnected(response.ok)
        console.log('🏥 Buddy agent health check:', response.ok ? 'Connected' : 'Disconnected')
      } catch (error) {
        setBuddyAgentConnected(false)
        console.log('🏥 Buddy agent health check: Offline')
      }
    }

    // Check immediately
    checkBuddyHealth()

    // Check every 30 seconds
    const healthInterval = setInterval(checkBuddyHealth, 30000)

    return () => clearInterval(healthInterval)
  }, [])

  // Send welcome message on mount
  useEffect(() => {
    console.log('🤖 Buddy Chat Component Loaded')
    console.log('📊 Environment:', {
      buddyAgentUrl: import.meta.env.VITE_BUDDY_AGENT_URL || 'http://localhost:8000',
      socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    })
    
    const welcomeMessage = {
      id: 'welcome',
      text: 'Hi! I\'m Buddy, your mental health companion. I\'m here to listen and support you. You can chat with me using text or switch to voice mode for spoken conversations. How are you feeling today?',
      sender: 'bot',
      timestamp: new Date(),
      suggestedActions: ['feeling_good', 'feeling_stressed', 'feeling_anxious', 'voice_mode']
    }
    setMessages([welcomeMessage])
  }, [t])

  // Voice recognition setup
  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in your browser. Please use Chrome or Safari.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    
    recognition.onstart = () => {
      setIsListening(true)
    }
    
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript
      setInputMessage(transcript)
      setIsListening(false)

      console.log('🎤 Voice recognition captured:', transcript)

      // Add user message to chat
      const userMessage = {
        id: Date.now(),
        text: transcript,
        sender: 'user',
        timestamp: new Date(),
        isVoice: true
      }
      setMessages(prev => [...prev, userMessage])

      // Send to voice agent and handle response
      try {
        setIsSending(true)
        console.log('🔄 Sending to buddy voice agent...')
        
        const buddyAgentUrl = import.meta.env.VITE_BUDDY_AGENT_URL || 'http://localhost:8000'
        const response = await fetch(`${buddyAgentUrl}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: transcript,
            session_id: `voice_session_${Date.now()}`,
            response_format: "json",
            user_id: user?._id || null,
            user_name: user?.name || null
          })
        })

        console.log('📡 Buddy API response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('✅ Buddy API response data:', data)
          
          // Create audio blob from base64
          if (data.audio_base64) {
            console.log('🔊 Processing audio response...')
            const audioBytes = atob(data.audio_base64)
            const audioArray = new Uint8Array(audioBytes.length)
            for (let i = 0; i < audioBytes.length; i++) {
              audioArray[i] = audioBytes.charCodeAt(i)
            }
            const audioBlob = new Blob([audioArray], { type: 'audio/mp3' })
            const audioUrl = URL.createObjectURL(audioBlob)
            
            // Add bot message with both text and audio
            const botMessage = {
              id: Date.now() + 1,
              text: data.text,
              sender: 'bot',
              timestamp: new Date(),
              isVoice: true,
              audioUrl: audioUrl,
              audioBase64: data.audio_base64
            }
            setMessages(prev => [...prev, botMessage])
            
            // Play audio response automatically
            console.log('▶️ Playing audio response...')
            const audio = new Audio(audioUrl)
            setIsPlaying(prev => ({ ...prev, [botMessage.id]: true }))
            
            audio.play().catch(err => {
              console.error('❌ Audio playback error:', err)
            })
            
            // Cleanup URL after audio ends
            audio.onended = () => {
              URL.revokeObjectURL(audioUrl)
              setIsPlaying(prev => ({ ...prev, [botMessage.id]: false }))
              console.log('🗑️ Audio URL cleaned up')
            }
          } else {
            console.warn('⚠️ No audio in response')
            // Add text-only message
            const botMessage = {
              id: Date.now() + 1,
              text: data.text || 'I received your message but couldn\'t generate audio.',
              sender: 'bot',
              timestamp: new Date(),
              isVoice: false
            }
            setMessages(prev => [...prev, botMessage])
          }
        } else {
          const errorText = await response.text()
          console.error('❌ Buddy API error:', response.status, errorText)
          throw new Error(`Voice service error: ${response.status} - ${errorText}`)
        }
      } catch (error) {
        console.error('❌ Voice service connection error:', error)
        const errorMessage = {
          id: Date.now() + 1,
          text: 'Sorry, I had trouble processing your voice message. The voice service might be unavailable.',
          sender: 'bot',
          timestamp: new Date(),
          isError: true
        }
        setMessages(prev => [...prev, errorMessage])
        
        console.log('🔄 Could try fallback to regular text chat...')
      } finally {
        setIsSending(false)
        setInputMessage('')
      }
    }
    
    recognition.onerror = () => {
      setIsListening(false)
    }
    
    recognition.onend = () => {
      setIsListening(false)
    }
    
    recognition.start()
  }

  // Severity assessment function
  const assessSeverity = (message) => {
    const severityKeywords = {
      high: ['suicide', 'kill myself', 'end it all', 'no point', 'worthless', 'hopeless'],
      medium: ['depressed', 'anxious', 'panic', 'stressed', 'overwhelmed', 'can\'t cope'],
      low: ['tired', 'worried', 'sad', 'confused', 'uncertain']
    }

    const messageText = message.toLowerCase()
    
    for (const keyword of severityKeywords.high) {
      if (messageText.includes(keyword)) {
        setSeverityLevel('high')
        setShowCounsellorSuggestion(true)
        return 'high'
      }
    }
    
    for (const keyword of severityKeywords.medium) {
      if (messageText.includes(keyword)) {
        setSeverityLevel('medium')
        return 'medium'
      }
    }
    
    for (const keyword of severityKeywords.low) {
      if (messageText.includes(keyword)) {
        setSeverityLevel('low')
        return 'low'
      }
    }
    
    return 'normal'
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleBuddyResponse = (data) => {
    if (data.risk_level) {
      setRiskLevel(data.risk_level)
      setRiskScore(data.risk_score || 0)
      setSeverityLevel(data.risk_level)
    }
    if (data.counsellor_recommendation?.recommended) {
      setCounsellorRec(data.counsellor_recommendation)
      if (data.risk_level === 'high' || data.risk_level === 'critical') {
        setShowCounsellorSuggestion(true)
      }
    }
    if (data.crisis_response?.is_crisis) {
      setCrisisModal({ isOpen: true, type: 'immediate' })
    }
    if (data.suggested_actions?.includes('crisis_escalation')) {
      setCrisisModal({ isOpen: true, type: 'escalation' })
    }
  }

  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || inputMessage.trim()
    if (!textToSend || isSending) return

    const userMessage = {
      id: Date.now(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date(),
      isVoice: !!messageText
    }

    setMessages(prev => [...prev, userMessage])
    if (!messageText) setInputMessage('')
    setIsSending(true)

    const severity = assessSeverity(textToSend)

    try {
      let responseReceived = false
      const buddyAgentUrl = import.meta.env.VITE_BUDDY_AGENT_URL || 'http://localhost:8000'

      // Primary: Try RAG buddy agent (voice or text mode)
      if (isVoiceMode) {
        try {
          const voiceResponse = await fetch(`${buddyAgentUrl}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: textToSend,
              session_id: sessionId,
              response_format: "json",
              user_id: user?._id || null,
              user_name: user?.name || null
            })
          })

          if (voiceResponse.ok) {
            const voiceData = await voiceResponse.json()
            setBuddyAgentConnected(true)
            handleBuddyResponse(voiceData)
            
            const botMessageId = Date.now() + 1
            const botMessage = {
              id: botMessageId,
              text: voiceData.reply || voiceData.text,
              sender: 'bot',
              timestamp: new Date(),
              isVoice: true,
              audioBase64: voiceData.audio_base64,
              riskLevel: voiceData.risk_level,
              copingExercise: voiceData.coping_exercise,
              counsellorRec: voiceData.counsellor_recommendation,
              suggestedActions: voiceData.suggested_actions || []
            }
            setMessages(prev => [...prev, botMessage])
            responseReceived = true

            if (voiceData.audio_base64) {
              try {
                const audioBlob = new Blob(
                  [Uint8Array.from(atob(voiceData.audio_base64), c => c.charCodeAt(0))], 
                  { type: 'audio/mp3' }
                )
                const audioUrl = URL.createObjectURL(audioBlob)
                const audio = new Audio(audioUrl)
                setIsPlaying(prev => ({ ...prev, [botMessageId]: true }))
                audio.play().catch(() => {})
                audio.onended = () => {
                  URL.revokeObjectURL(audioUrl)
                  setIsPlaying(prev => ({ ...prev, [botMessageId]: false }))
                }
              } catch (audioError) {
                console.error('Audio processing error:', audioError)
              }
            }
          }
        } catch (voiceError) {
          console.error('Voice agent request failed:', voiceError)
          setBuddyAgentConnected(false)
        }
      } else {
        try {
          const textResponse = await fetch(`${buddyAgentUrl}/chat/text`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: textToSend,
              session_id: sessionId,
              user_id: user?._id || null,
              user_name: user?.name || null
            })
          })

          if (textResponse.ok) {
            const textData = await textResponse.json()
            setBuddyAgentConnected(true)
            handleBuddyResponse(textData)
            
            const botMessage = {
              id: Date.now() + 1,
              text: textData.text,
              sender: 'bot',
              timestamp: new Date(),
              isVoice: false,
              riskLevel: textData.risk_level,
              copingExercise: textData.coping_exercise,
              counsellorRec: textData.counsellor_recommendation,
              suggestedActions: textData.suggested_actions || []
            }
            setMessages(prev => [...prev, botMessage])
            responseReceived = true
          }
        } catch (textError) {
          console.error('Text agent request failed:', textError)
          setBuddyAgentConnected(false)
        }
      }

      // Fallback: Try original server API
      if (!responseReceived) {
        try {
          const apiPromise = post('/v1/chat/message', {
            message: textToSend,
            severity: severity,
            timestamp: new Date().toISOString()
          })

          if (socketRef.current?.connected) {
            socketRef.current.emit('user_message', {
              message: textToSend,
              severity: severity,
              timestamp: new Date().toISOString()
            })
          }

          const response = await apiPromise
          
          if (response?.data?.message) {
            const botMessage = {
              id: Date.now() + 1,
              text: response.data.message,
              sender: 'bot',
              timestamp: new Date(),
              suggestedActions: response.data.suggestedActions || []
            }
            setMessages(prev => [...prev, botMessage])
            if (response.data.suggestedActions?.includes('crisis_escalation')) {
              setCrisisModal({ isOpen: true, type: 'escalation' })
            }
            responseReceived = true
          }
        } catch (serverError) {
          console.error('Fallback API error:', serverError)
        }
      }

      if (!responseReceived) {
        throw new Error('All services unavailable')
      }

    } catch (error) {
      console.error('Error in sendMessage:', error)
      const errorMessage = {
        id: Date.now() + 2,
        text: 'Sorry, I\'m having trouble responding right now. Please try again or reach out to a crisis line if you need immediate help (988).',
        sender: 'system',
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSuggestedAction = (action) => {
    switch (action) {
      case 'feeling_good':
        sendMessage("I'm feeling good today!")
        break
      case 'feeling_stressed':
        sendMessage("I'm feeling stressed and need some help.")
        break
      case 'feeling_anxious':
        sendMessage("I'm feeling anxious and worried.")
        break
      case 'voice_mode':
        setIsVoiceMode(!isVoiceMode)
        break
      case 'breathing_exercise':
        startBreathingExercise()
        break
      case 'grounding_technique':
        startGroundingTechnique()
        break
      case 'crisis_escalation':
        setCrisisModal({ isOpen: true, type: 'immediate' })
        break
      case 'book_counsellor':
        window.location.href = '/booking'
        break
      default:
        sendMessage(action)
    }
  }

  const startBreathingExercise = () => {
    const breathingMessage = {
      id: Date.now(),
      text: t('chat.breathingExercise.instruction'),
      sender: 'bot',
      timestamp: new Date(),
      isBreathingExercise: true
    }
    setMessages(prev => [...prev, breathingMessage])
  }

  const startGroundingTechnique = () => {
    const groundingMessage = {
      id: Date.now(),
      text: t('chat.grounding.instruction'),
      sender: 'bot',
      timestamp: new Date(),
      suggestedActions: ['grounding_5things', 'grounding_4things', 'grounding_3things']
    }
    setMessages(prev => [...prev, groundingMessage])
  }

  const handleContactCounselor = async () => {
    try {
      await post('/api/v1/crisis/contact-counselor', {
        source: 'chat',
        urgency: crisisModal.type,
        timestamp: new Date().toISOString()
      })
      
      const confirmationMessage = {
        id: Date.now(),
        text: t('chat.counselorContacted'),
        sender: 'system',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, confirmationMessage])
    } catch (error) {
      console.error('Error contacting counselor:', error)
    }
  }

  // VOICE-ONLY UI RENDER MESSAGE FUNCTION
  const renderMessage = (message) => {
    const isUser = message.sender === 'user'
    const isSystem = message.sender === 'system'
    const isBot = message.sender === 'bot'

    // Voice-only mode special rendering for bot messages
    if (isVoiceMode && isBot && !message.suggestedActions?.length && !message.isBreathingExercise) {
      return (
        <div
          key={message.id}
          className="flex justify-start mb-6"
        >
          <div className="max-w-[80%] order-1">
            {/* Voice Assistant Avatar */}
            <div className="flex items-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 flex items-center justify-center mr-4 shadow-xl voice-avatar">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                    {(message.audioBase64 || message.audioUrl) && isPlaying[message.id] ? (
                      // Animated speaking bars
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-gradient-to-t from-purple-600 to-blue-600 rounded-full speaking-bar"
                            style={{
                              height: '4px',
                              animationDelay: `${i * 0.1}s`,
                              animation: 'voiceBounce 1.2s ease-in-out infinite'
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </div>
                  {/* Glow effect when speaking */}
                  {(message.audioBase64 || message.audioUrl) && isPlaying[message.id] && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 opacity-20 animate-ping" />
                  )}
                </div>
                <div>
                  <div className="flex items-center">
                    <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      Buddy
                    </span>
                    <div className="ml-2 flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-1 ${
                        (message.audioBase64 || message.audioUrl) && isPlaying[message.id] 
                          ? 'bg-green-500 animate-pulse' 
                          : 'bg-blue-500'
                      }`} />
                      <span className="text-xs text-gray-600">
                        {(message.audioBase64 || message.audioUrl) && isPlaying[message.id] 
                          ? 'Speaking...' 
                          : 'Ready'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Response Card - NO TEXT BUBBLE */}
            <div className="relative">
              <div className="voice-response-card bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 border-2 border-purple-200 rounded-3xl p-8 shadow-2xl">
                <div className="text-center">
                  {/* Main Audio Waveform */}
                  <div className="flex items-center justify-center space-x-3 mb-6">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="w-3 bg-gradient-to-t from-purple-400 via-blue-500 to-teal-500 rounded-full waveform-bar"
                        style={{
                          height: `${20 + Math.sin(i * 0.8) * 15}px`,
                          animationDelay: `${i * 0.15}s`
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Status Text */}
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      🎵 Audio Response
                    </h3>
                    <p className="text-purple-700 text-lg font-medium">
                      {(message.audioBase64 || message.audioUrl) && isPlaying[message.id] 
                        ? '🔊 Playing your response...' 
                        : '✨ Ready to speak'
                      }
                    </p>
                  </div>

                  {/* Decorative elements */}
                  <div className="flex justify-center space-x-4 mb-4">
                    <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
                    <div className="w-8 h-1 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full"></div>
                    <div className="w-12 h-1 bg-gradient-to-r from-teal-400 to-purple-400 rounded-full"></div>
                  </div>
                </div>

                {/* Hidden Auto-playing Audio */}
                {(message.audioUrl || message.audioBase64) && (
                  <div className="mt-6">
                    <audio 
                      controls 
                      autoPlay 
                      className="w-full rounded-xl opacity-80 scale-95 transform hover:scale-100 transition-transform"
                      style={{ 
                        filter: 'sepia(0.2) hue-rotate(240deg) saturate(1.5)',
                        background: 'linear-gradient(45deg, #f3e8ff, #e0f2fe)'
                      }}
                      onPlay={() => setIsPlaying(prev => ({ ...prev, [message.id]: true }))}
                      onEnded={() => setIsPlaying(prev => ({ ...prev, [message.id]: false }))}
                      onPause={() => setIsPlaying(prev => ({ ...prev, [message.id]: false }))}
                    >
                      {message.audioUrl && (
                        <source src={message.audioUrl} type="audio/mp3" />
                      )}
                      {message.audioBase64 && (
                        <source 
                          src={`data:audio/mp3;base64,${message.audioBase64}`} 
                          type="audio/mp3" 
                        />
                      )}
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}

                {/* Timestamp */}
                <div className="mt-4 text-sm text-purple-500 text-center font-medium">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Regular rendering for user messages, system messages, and text mode
    return (
      <div
        key={message.id}
        className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        {/* Avatar for non-user messages */}
        {!isUser && (
          <div className="flex-shrink-0 mr-4 mt-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isSystem ? 'bg-yellow-100 text-yellow-600' : 'bg-[#466a65]/10 text-[#466a65]'
            }`}>
              {isSystem ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative text-sm leading-relaxed ${
            isUser
              ? 'bg-[#f4f4f4] text-gray-800 rounded-[24px] px-5 py-3 max-w-[75%]'
              : isSystem
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl px-5 py-3 max-w-[85%]'
              : message.isError
              ? 'bg-red-50 border border-red-200 text-red-800 rounded-2xl px-5 py-3 max-w-[85%]'
              : 'bg-transparent text-gray-800 py-1.5 max-w-[85%]'
          }`}
        >
            {/* Message Content */}
            <div className="whitespace-pre-wrap">
              {message.text}
              {/* Voice indicator */}
              {message.isVoice && (
                <span className={`inline-flex items-center ml-2 text-xs ${isUser ? 'text-gray-400' : 'text-[#466a65]'}`}>
                  {message.sender === 'user' ? (
                    <svg className="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                    </svg>
                  )}
                </span>
              )}
            </div>

            {/* Audio Player for Voice Responses in text mode */}
            {!isVoiceMode && (message.audioUrl || message.audioBase64) && (
              <div className="mt-2">
                <audio controls className="w-full max-w-xs">
                  {message.audioUrl && (
                    <source src={message.audioUrl} type="audio/mp3" />
                  )}
                  {message.audioBase64 && (
                    <source 
                      src={`data:audio/mp3;base64,${message.audioBase64}`} 
                      type="audio/mp3" 
                    />
                  )}
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* Breathing Exercise Component */}
            {message.isBreathingExercise && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <p className="text-blue-800 font-medium">{t('chat.breathingExercise.steps')}</p>
                  <div className="mt-2 text-blue-600 text-sm">
                    {t('chat.breathingExercise.cycle')}
                  </div>
                </div>
              </div>
            )}

            {/* Coping Exercise Card */}
            {message.copingExercise && (
              <div className="mt-3 p-4 bg-[#f9ebe4] border border-[#f0dacd] rounded-xl">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#eca884] flex items-center justify-center mr-2 text-white">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-orange-900 text-sm">{message.copingExercise.title}</span>
                  {message.copingExercise.duration && (
                    <span className="ml-auto text-xs font-medium text-orange-800 bg-orange-100/50 px-2 py-0.5 rounded-full">{message.copingExercise.duration}</span>
                  )}
                </div>
                {message.copingExercise.instructions && (
                  <ol className="text-xs text-teal-700 space-y-1 ml-5 list-decimal">
                    {message.copingExercise.instructions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {/* Inline Counsellor Recommendation */}
            {message.counsellorRec?.recommended && (
              <div className={`mt-3 p-4 rounded-xl border ${
                message.counsellorRec.urgency === 'immediate' ? 'bg-red-50 border-red-200' :
                message.counsellorRec.urgency === 'high' ? 'bg-orange-50 border-orange-200' :
                'bg-[#f9ebe4] border-[#f0dacd]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      message.counsellorRec.urgency === 'immediate' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${
                      message.counsellorRec.urgency === 'immediate' ? 'text-red-700' : 'text-orange-900'
                    }`}>
                      {message.counsellorRec.message}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSuggestedAction('book_counsellor')}
                    className={`ml-2 px-3 py-1 text-xs rounded-full font-medium text-white ${
                      message.counsellorRec.urgency === 'immediate' ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            )}

            {/* Suggested Actions */}
            {message.suggestedActions && message.suggestedActions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.suggestedActions.map((action, index) => {
                  const actionLabels = {
                    crisis_escalation: 'Get Emergency Help',
                    emergency_contact: 'Call 911',
                    immediate_help: 'Crisis Line: 988',
                    contact_counsellor: 'Contact Counsellor',
                    book_counsellor: 'Book Session',
                    crisis_resources: 'Crisis Resources',
                    breathing_exercise: 'Breathing Exercise',
                    seek_counseling: 'Talk to Professional',
                    optional_counselling: 'Consider Counselling',
                    coping_strategies: 'Coping Strategies',
                    journaling: 'Try Journaling',
                    self_help_resources: 'Self-Help Resources',
                    mindfulness: 'Mindfulness',
                  }
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestedAction(action)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        action === 'crisis_escalation' || action === 'emergency_contact' || action === 'immediate_help'
                          ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                          : action === 'book_counsellor' || action === 'contact_counsellor' || action === 'seek_counseling'
                          ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                      }`}
                    >
                      {actionLabels[action] || action.replace(/_/g, ' ')}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Risk Level Indicator (for bot messages with elevated risk) */}
            {isBot && message.riskLevel && message.riskLevel !== 'low' && (
              <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs ${RISK_COLORS[message.riskLevel]?.bg} ${RISK_COLORS[message.riskLevel]?.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${RISK_COLORS[message.riskLevel]?.dot}`} />
                {message.riskLevel === 'critical' ? 'Immediate support recommended' :
                 message.riskLevel === 'high' ? 'Professional help recommended' :
                 'Counselling available'}
              </div>
            )}

            {/* Timestamp */}
            <div className={`mt-2 text-[11px] ${
              isUser ? 'text-gray-400' : 'text-gray-400'
            }`}>
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">
      {/* Custom CSS Styles */}
      <style jsx>{`
        /* Voice-only UI Animations */
        .voice-response-card {
          animation: voicePulse 3s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }

        .voice-response-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.1), transparent);
          animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes voicePulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 40px rgba(168, 85, 247, 0.6);
            transform: scale(1.02);
          }
        }

        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        .voice-avatar {
          animation: avatarGlow 2s ease-in-out infinite;
        }

        @keyframes avatarGlow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
          }
          50% {
            box-shadow: 0 0 25px rgba(168, 85, 247, 0.8);
          }
        }

        .speaking-bar, .waveform-bar {
          animation: voiceBounce 1.5s ease-in-out infinite;
        }

        @keyframes voiceBounce {
          0%, 80%, 100% {
            height: 4px;
            opacity: 0.6;
          }
          40% {
            height: 20px;
            opacity: 1;
          }
        }

        .waveform-bar {
          animation: waveformDance 2s ease-in-out infinite;
        }

        @keyframes waveformDance {
          0%, 100% {
            transform: scaleY(0.4);
            opacity: 0.7;
          }
          50% {
            transform: scaleY(1.2);
            opacity: 1;
          }
        }

        /* Enhanced Audio Player Styling */
        audio {
          border-radius: 12px;
          background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 100%);
          border: 2px solid rgba(168, 85, 247, 0.2);
        }

        audio::-webkit-media-controls-panel {
          background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 100%);
        }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-gray-100 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#466a65]/10 text-[#466a65] rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Buddy - Mental Health Support
              </h1>
              <div className="flex items-center text-sm text-gray-500">
                <div className={`w-2 h-2 rounded-full mx-2 ${
                  buddyAgentConnected === true ? 'bg-green-400' : 
                  buddyAgentConnected === false ? 'bg-red-400' : 'bg-yellow-400'
                }`} />
                Buddy: {
                  buddyAgentConnected === true ? 'Online' : 
                  buddyAgentConnected === false ? 'Offline' : 'Checking...'
                }
                {riskLevel !== 'low' && (
                  <span className={`ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[riskLevel]?.bg} ${RISK_COLORS[riskLevel]?.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${RISK_COLORS[riskLevel]?.dot}`} />
                    Risk: {riskLevel} ({riskScore}/100)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsVoiceMode(!isVoiceMode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                isVoiceMode
                  ? 'bg-[#466a65] text-white shadow-sm hover:bg-[#385551]'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {isVoiceMode ? 'Voice Mode Active' : 'Switch to Voice'}
            </button>
            <div className="text-sm text-gray-500">
              RAG-Powered Support
            </div>
          </div>
        </div>

        {/* Counsellor Recommendation Banner */}
        {showCounsellorSuggestion && counsellorRec && (
          <div className={`mt-3 p-3 rounded-lg border ${
            riskLevel === 'critical' ? 'bg-red-50 border-red-300' :
            riskLevel === 'high' ? 'bg-orange-50 border-orange-300' :
            'bg-yellow-50 border-yellow-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  riskLevel === 'critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <span className={`font-semibold ${
                    riskLevel === 'critical' ? 'text-red-800' : 'text-orange-800'
                  }`}>
                    {counsellorRec.message || 'Would you like to connect with a professional counsellor?'}
                  </span>
                  {counsellorRec.session_type && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-white/50">
                      Recommended: {counsellorRec.session_type} session
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleSuggestedAction('book_counsellor')}
                className={`ml-4 px-4 py-2 text-white rounded-lg transition-colors font-medium ${
                  riskLevel === 'critical' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {counsellorRec.urgency === 'immediate' ? 'Get Help Now' : 'Book Counsellor'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {messages.map(renderMessage)}
          
          {/* Typing Indicator for Voice Mode */}
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[70%]">
                <div className="flex items-center mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mr-3 animate-pulse">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Buddy is thinking...</span>
                </div>
                {isVoiceMode ? (
                  <div className="bg-gray-50 border-2 border-teal-200 rounded-2xl px-6 py-4 shadow-lg">
                    <div className="flex justify-center space-x-2">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-8 bg-gradient-to-t from-teal-600 to-teal-800 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white px-4 sm:px-6 pt-4 pb-8 mx-auto w-full max-w-4xl">
        <div className="relative flex items-end border border-gray-300 rounded-[24px] bg-white shadow-[0_0_15px_rgba(0,0,0,0.03)] focus-within:shadow-[0_0_15px_rgba(0,0,0,0.08)] transition-shadow">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isVoiceMode ? "Click the mic button to speak..." : "Type your message here..."}
            className="w-full pl-6 pr-[110px] py-4 max-h-[150px] resize-none bg-transparent outline-none border-none text-gray-800 placeholder-gray-400"
            rows="1"
            style={{ maxHeight: '150px', minHeight: '56px' }}
            disabled={isVoiceMode && !inputMessage}
            aria-label="Type your message"
          />
          
          <div className="absolute right-2 bottom-2 flex items-center space-x-1">
            {/* Voice Input Button */}
            {isVoiceMode && (
              <button
                onClick={startVoiceRecognition}
                disabled={isListening}
                className={`p-2.5 rounded-full transition-all duration-300 ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-[#466a65]'
                }`}
                aria-label="Voice input"
              >
                {isListening ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            )}

            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isSending}
              className={`p-2.5 rounded-full transition-all duration-200 flex items-center justify-center ${
                inputMessage.trim() && !isSending
                  ? 'bg-[#466a65] text-white hover:bg-[#385551] shadow-sm'
                  : 'bg-[#f4f4f4] text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
          
          {!isConnected && !buddyAgentConnected && (
            <div className="mt-2 text-center text-sm text-red-600">
              Services are offline. Please try again later.
            </div>
          )}
      </div>

      {/* Crisis Modal */}
      <CrisisModal
        isOpen={crisisModal.isOpen}
        onClose={() => setCrisisModal({ isOpen: false, type: null })}
        crisisType={crisisModal.type}
        onContactCounselor={handleContactCounselor}
      />
    </div>
  )
}

export default Chat
