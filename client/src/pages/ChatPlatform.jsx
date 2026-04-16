import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useApi } from '../hooks/useApi'
import { SOCKET_URL } from '../utils/api'

const APPOINTMENT_SESSION_WARN_MS = 5 * 60 * 1000
const APPOINTMENT_EXTENSION_MINUTES = [5, 10, 15, 20, 30, 45, 60]

const ChatPlatform = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { callApi } = useApi()

  // Core state
  const [user, setUser] = useState(null)
  const [currentChat, setCurrentChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)

  // Chat management
  const [activeChats, setActiveChats] = useState([])
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  // Video calling state
  const [inVideoCall, setInVideoCall] = useState(false)
  const [localVideoTestActive, setLocalVideoTestActive] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)
  const [callControls, setCallControls] = useState({
    video: true,
    audio: true,
    screenShare: false
  })

  // Media refs
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const socketRef = useRef(null)

  // UI refs
  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  // Scheduled appointment session (server slotStart / slotEnd)
  const [sessionTick, setSessionTick] = useState(0)
  const [extendModalOpen, setExtendModalOpen] = useState(false)
  const [dismissedExtendForEndKey, setDismissedExtendForEndKey] = useState(null)
  const [extendSubmitting, setExtendSubmitting] = useState(false)

  const isUrlTestMode = () =>
    new URLSearchParams(window.location.search).get('test') === 'true'

  const getAppointmentSessionPhase = useCallback(() => {
    if (!currentChat) return 'unrestricted'
    if (currentChat.type === 'test' || isUrlTestMode()) return 'active'
    if (currentChat.type !== 'appointment') return 'unrestricted'
    if (!currentChat.slotStart || !currentChat.slotEnd) return 'unrestricted'
    const now = Date.now()
    const start = new Date(currentChat.slotStart).getTime()
    const end = new Date(currentChat.slotEnd).getTime()
    if (now < start) return 'waiting'
    if (now >= end) return 'ended'
    return 'active'
  }, [currentChat])

  const getSessionRemainingMs = useCallback(() => {
    if (!currentChat || currentChat.type === 'test' || isUrlTestMode()) return null
    if (currentChat.type !== 'appointment' || !currentChat.slotEnd) return null
    return new Date(currentChat.slotEnd).getTime() - Date.now()
  }, [currentChat])

  // ICE servers configuration for WebRTC
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  }

  // Initialize socket connection and user data
  useEffect(() => {
    initializeUser()
    initializeSocket()
    
    return () => {
      cleanup()
    }
  }, [])

  // Handle URL parameters for appointment chat
  useEffect(() => {
    try {
      const appointmentId = searchParams.get('appointment')
      const userId = searchParams.get('user')
      
      console.log('URL params - appointmentId:', appointmentId, 'userId:', userId)
      console.log('User loaded:', !!user)
      
      if (appointmentId && userId && user) {
        console.log('User is loaded, initiating appointment chat...')
        initiateAppointmentChat(appointmentId, userId)
      } else if (appointmentId && userId && !user) {
        console.log('Waiting for user data to load...')
      } else {
        console.log('Missing URL parameters for appointment chat')
      }
    } catch (error) {
      console.error('Error processing URL parameters:', error)
    }
  }, [searchParams, user])

  useEffect(() => {
    setDismissedExtendForEndKey(null)
    setExtendModalOpen(false)
  }, [currentChat?.appointmentId])

  // Re-render once per second while a timed appointment session is open
  useEffect(() => {
    if (currentChat?.type !== 'appointment' || !currentChat?.slotEnd) return undefined
    const id = setInterval(() => setSessionTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [currentChat?.type, currentChat?.appointmentId, currentChat?.slotEnd])

  // Prompt to extend when less than SESSION_WARN_MS remains
  useEffect(() => {
    if (currentChat?.type !== 'appointment' || !currentChat?.slotEnd || isUrlTestMode()) return
    const end = new Date(currentChat.slotEnd).getTime()
    const start = new Date(currentChat.slotStart).getTime()
    const now = Date.now()
    const endKey = String(end)
    if (dismissedExtendForEndKey === endKey) return
    if (now < start || now >= end) return
    const remaining = end - now
    if (remaining > 0 && remaining <= APPOINTMENT_SESSION_WARN_MS) {
      setExtendModalOpen(true)
    }
  }, [sessionTick, currentChat, dismissedExtendForEndKey])

  useEffect(() => {
    if (getAppointmentSessionPhase() === 'ended') {
      setExtendModalOpen(false)
    }
  }, [sessionTick, getAppointmentSessionPhase])

  // Close video automatically when the scheduled session ends
  useEffect(() => {
    if (getAppointmentSessionPhase() !== 'ended' || !inVideoCall) return
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    if (socketRef.current && currentChat?.partnerId) {
      socketRef.current.emit('call_ended', { recipientId: currentChat.partnerId })
    }
    setInVideoCall(false)
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
  }, [sessionTick, currentChat, inVideoCall, getAppointmentSessionPhase])

  const initializeUser = () => {
    const userData = localStorage.getItem('Mann-Mitra_user') || localStorage.getItem('user')
    const token = localStorage.getItem('Mann-Mitra_token') || localStorage.getItem('token')
    const urlParams = new URLSearchParams(window.location.search)
    const isTestMode = urlParams.get('test') === 'true'

    if (isTestMode) {
      setUser({
        _id: 'test-user-id',
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student'
      })
      return
    }

    if (!userData || !token) {
      alert('Please log in first to access the chat.')
      navigate('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      if (!parsedUser._id && parsedUser.id) parsedUser._id = parsedUser.id
      if (!parsedUser.id && parsedUser._id) parsedUser.id = parsedUser._id
      setUser(parsedUser)
    } catch (error) {
      console.error('Error parsing user data:', error)
      navigate('/login')
    }
  }

  const initializeSocket = () => {
    const token = localStorage.getItem('Mann-Mitra_token') || localStorage.getItem('token')
    const urlParams = new URLSearchParams(window.location.search)
    const isTestMode = urlParams.get('test') === 'true'
    
    if (isTestMode) {
      console.log('🧪 Test mode - skipping socket connection')
      setIsConnected(true) // Fake connection for UI
      return
    }
    
    if (!token) {
      console.error('No authentication token found')
      setIsConnected(false)
      return
    }
    
    const socketURL = SOCKET_URL
    console.log('Connecting to socket server:', socketURL)
    
    socketRef.current = io(socketURL, {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    const socket = socketRef.current

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to chat server')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from chat server')
      setIsConnected(false)
    })

    // Chat events
    socket.on('private_message', handleIncomingMessage)
    socket.on('user_typing', handleUserTyping)
    socket.on('message_sent', handleMessageSent)

    // Video call events
    socket.on('incoming_call', handleIncomingCall)
    socket.on('call_accepted', handleCallAccepted)
    socket.on('call_rejected', handleCallRejected)
    socket.on('call_ended', handleCallEnded)
    socket.on('webrtc_offer', handleWebRTCOffer)
    socket.on('webrtc_answer', handleWebRTCAnswer)
    socket.on('webrtc_ice_candidate', handleICECandidate)

    // Presence events
    socket.on('user_online', (userId) => {
      setOnlineUsers(prev => new Set([...prev, userId]))
    })

    socket.on('user_offline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    })
  }

  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
  }

  const initiateAppointmentChat = async (appointmentId, otherUserId) => {
    try {
      console.log('Initiating chat for appointment:', appointmentId, 'with user:', otherUserId)
      console.log('Current user:', user)
      
      // Check if user is loaded
      if (!user) {
        console.error('User not loaded yet, waiting...')
        return
      }
      
      // Handle test case
      if (appointmentId === 'test' || otherUserId === 'test') {
        console.log('Test mode - setting up demo chat')
        setCurrentChat({
          type: 'test',
          appointmentId: 'test',
          partnerId: 'test-user',
          partnerName: 'Test Partner',
          partnerRole: user.role === 'student' ? 'counsellor' : 'student'
        })
        
        // Don't try to fetch real data or connect to socket for test
        return
      }
      
      // Validate MongoDB ObjectId format
      const objectIdRegex = /^[0-9a-fA-F]{24}$/
      if (!objectIdRegex.test(appointmentId)) {
        console.error('Invalid appointment ID format:', appointmentId)
        alert('Invalid appointment ID. Please use a valid appointment link.')
        return
      }
      
      // Fetch appointment details
      const response = await callApi(`/api/v1/appointments/${appointmentId}`, 'GET')
      
      if (response.success) {
        const serverResponse = response.data || response
        const appointment = serverResponse.appointment || serverResponse
        
        console.log('Appointment data received:', appointment)
        
        // Set up chat with the other participant
        let chatPartner = null
        let partnerRole = ''
        
        if (user.role === 'student') {
          chatPartner = appointment.counsellorId
          partnerRole = 'counsellor'
        } else if (user.role === 'counsellor') {
          chatPartner = appointment.studentId
          partnerRole = 'student'
        } else {
          console.error('Invalid user role:', user.role)
          alert('Invalid user role. Please login again.')
          return
        }
          
        if (!chatPartner) {
          console.error('Chat partner not found in appointment data')
          console.error('Appointment data:', appointment)
          alert('Unable to find chat partner information. Please check if this appointment is properly configured.')
          return
        }
          
        const sessionMode = appointment.mode === 'video' ? 'video' : 'chat'

        setCurrentChat({
          type: 'appointment',
          appointmentId,
          partnerId: chatPartner._id || chatPartner,
          partnerName: chatPartner.name || 'Chat Partner',
          partnerRole: partnerRole,
          slotStart: appointment.slotStart,
          slotEnd: appointment.slotEnd,
          sessionMode
        })

        // Join appointment room
        if (socketRef.current) {
          socketRef.current.emit('join_room', {
            roomId: `appointment_${appointmentId}`,
            roomType: 'appointment'
          })
        }

        // Load message history
        await loadMessageHistory(appointmentId)
      } else {
        console.error('Failed to fetch appointment:', response.message)
        alert('Unable to load appointment details. Please check if you have access to this appointment.')
      }
    } catch (error) {
      console.error('Error initiating appointment chat:', error)
      alert('Failed to initialize chat. Please try again or contact support.')
    }
  }

  const loadMessageHistory = async (appointmentId) => {
    try {
      // Skip loading for test appointments
      if (appointmentId === 'test') {
        console.log('Test mode - using demo messages')
        setMessages([
          {
            id: 'demo1',
            senderId: 'test-user',
            senderName: 'Test Partner',
            senderRole: user.role === 'student' ? 'counsellor' : 'student',
            message: 'Hello! This is a demo chat message.',
            timestamp: new Date()
          }
        ])
        return
      }
      
      const response = await callApi(`/api/v1/chat/messages/${appointmentId}`, 'GET')
      
      if (response.success) {
        const serverResponse = response.data || response
        setMessages(serverResponse.messages || [])
        console.log('Loaded message history:', serverResponse.messages?.length || 0, 'messages')
      } else {
        console.error('Failed to load message history:', response.message)
        setMessages([])
      }
    } catch (error) {
      console.error('Error loading message history:', error)
      setMessages([])
    }
  }

  const handleIncomingMessage = (messageData) => {
    setMessages(prev => [...prev, {
      ...messageData,
      timestamp: new Date(messageData.timestamp)
    }])
    scrollToBottom()
  }

  const handleUserTyping = ({ userId, isTyping }) => {
    if (currentChat && userId === currentChat.partnerId) {
      setOtherUserTyping(isTyping)
    }
  }

  const handleMessageSent = ({ messageId, timestamp }) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, sent: true, timestamp: new Date(timestamp) } : msg
    ))
  }

  const sendMessage = async () => {
    console.log('📤 sendMessage called:', { 
      inputMessage: inputMessage?.trim(), 
      hasCurrentChat: !!currentChat, 
      currentChatType: currentChat?.type,
      user: user 
    })

    const phase = getAppointmentSessionPhase()
    if (currentChat?.type === 'appointment' && phase !== 'active') {
      if (phase === 'waiting') {
        alert('Your session has not started yet. You can chat during your scheduled time window.')
      } else if (phase === 'ended') {
        alert('This session has ended.')
      }
      return
    }
    
    if (!inputMessage.trim() || !currentChat) {
      console.warn('❌ sendMessage blocked:', { 
        noInputMessage: !inputMessage.trim(), 
        noCurrentChat: !currentChat 
      })
      return
    }

    const tempMessage = {
      id: `temp_${Date.now()}`,
      senderId: user._id || user.id,
      senderName: user.name,
      senderRole: user.role,
      message: inputMessage.trim(),
      messageType: 'text',
      timestamp: new Date(),
      sent: false,
      temp: true
    }

    setMessages(prev => [...prev, tempMessage])
    
    // Handle test mode
    if (currentChat.type === 'test') {
      console.log('Test mode - simulating message sent')
      // Simulate message delivery
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id ? { ...msg, sent: true, temp: false } : msg
        ))
        
        // Add an auto-reply for demo
        setTimeout(() => {
          const autoReply = {
            id: `auto_${Date.now()}`,
            senderId: 'test-user',
            senderName: 'Test Partner',
            senderRole: user.role === 'student' ? 'counsellor' : 'student',
            message: 'Thanks for your message! This is an automated test response.',
            messageType: 'text',
            timestamp: new Date(),
            sent: true
          }
          setMessages(prev => [...prev, autoReply])
          scrollToBottom()
        }, 1000)
      }, 500)
    } else {
      // Real message sending
      if (socketRef.current) {
        socketRef.current.emit('private_message', {
          recipientId: currentChat.partnerId,
          message: inputMessage.trim(),
          messageType: 'text',
          appointmentId: currentChat.appointmentId
        })
      } else {
        console.error('Socket not connected - message not sent')
        // Remove the temp message if socket not connected
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        alert('Not connected to chat server. Please refresh and try again.')
        return
      }
    }

    setInputMessage('')
    inputRef.current?.focus()
    scrollToBottom()
  }

  const handleTyping = () => {
    if (!currentChat) return
    if (currentChat.type === 'appointment' && getAppointmentSessionPhase() !== 'active') return
    
    setIsTyping(true)
    socketRef.current.emit('typing', {
      roomId: `appointment_${currentChat.appointmentId}`,
      isTyping: true
    })

    // Clear typing indicator after 3 seconds
    clearTimeout(window.typingTimeout)
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false)
      socketRef.current.emit('typing', {
        roomId: `appointment_${currentChat.appointmentId}`,
        isTyping: false
      })
    }, 3000)
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesContainerRef.current?.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }, 100)
  }

  // Local video test: open preview modal, show camera feed, close stops stream
  const startLocalVideoTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      setLocalVideoTestActive(true)
      setTimeout(() => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
      }, 100)
    } catch (error) {
      console.error('Local video test failed:', error)
      alert('Camera/microphone access denied or not available. Please check permissions.')
    }
  }

  const closeLocalVideoTest = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    setLocalVideoTestActive(false)
  }

  // Video calling functions
  const startVideoCall = async () => {
    try {
      if (!currentChat) return

      if (currentChat.type === 'appointment') {
        if (currentChat.sessionMode !== 'video') {
          alert('Video calls are only available when your booking is a video session.')
          return
        }
        if (getAppointmentSessionPhase() !== 'active') {
          alert('You can start the video call only during your scheduled session time.')
          return
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      
      localStreamRef.current = stream
      
      // Safely set video source if element exists
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      } else {
        console.warn('Local video element not found')
      }

      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection(iceServers)
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        } else {
          console.warn('Remote video element not found in startVideoCall')
        }
      }

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('webrtc_ice_candidate', {
            candidate: event.candidate,
            recipientId: currentChat.partnerId
          })
        }
      }

      // Create and send offer
      const offer = await peerConnectionRef.current.createOffer()
      await peerConnectionRef.current.setLocalDescription(offer)
      
      socketRef.current.emit('initiate_call', {
        recipientId: currentChat.partnerId,
        offer,
        callType: 'video'
      })

      setInVideoCall(true)
    } catch (error) {
      console.error('Error starting video call:', error)
      alert('Failed to start video call. Please check your camera and microphone permissions.')
    }
  }

  const handleIncomingCall = ({ senderId, senderName, offer, callType }) => {
    setIncomingCall({
      senderId,
      senderName,
      offer,
      callType
    })
  }

  const acceptCall = async () => {
    try {
      const { senderId, offer } = incomingCall
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      
      localStreamRef.current = stream
      
      // Safely set video source if element exists
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      } else {
        console.warn('Local video element not found in acceptCall')
      }

      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection(iceServers)
      
      // Add local stream
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        } else {
          console.warn('Remote video element not found in acceptCall')
        }
      }

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('webrtc_ice_candidate', {
            candidate: event.candidate,
            recipientId: senderId
          })
        }
      }

      // Set remote description and create answer
      await peerConnectionRef.current.setRemoteDescription(offer)
      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)
      
      socketRef.current.emit('call_accepted', {
        senderId,
        answer
      })

      setInVideoCall(true)
      setIncomingCall(null)
    } catch (error) {
      console.error('Error accepting call:', error)
    }
  }

  const rejectCall = () => {
    socketRef.current.emit('call_rejected', {
      senderId: incomingCall.senderId
    })
    setIncomingCall(null)
  }

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }

    socketRef.current.emit('call_ended', {
      recipientId: currentChat?.partnerId
    })

    setInVideoCall(false)
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
  }

  const handleCallAccepted = async ({ answer }) => {
    await peerConnectionRef.current.setRemoteDescription(answer)
  }

  const handleCallRejected = () => {
    alert('Call was rejected')
    endCall()
  }

  const handleCallEnded = () => {
    endCall()
  }

  const handleWebRTCOffer = async ({ offer, senderId }) => {
    // Handle when receiving an offer (for incoming calls)
    setIncomingCall(prev => ({ ...prev, offer }))
  }

  const handleWebRTCAnswer = async ({ answer }) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(answer)
    }
  }

  const handleICECandidate = async ({ candidate }) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(candidate)
    }
  }

  const dismissExtendModal = () => {
    if (!currentChat?.slotEnd) return
    setDismissedExtendForEndKey(String(new Date(currentChat.slotEnd).getTime()))
    setExtendModalOpen(false)
  }

  const submitSessionExtension = async (minutes) => {
    if (!currentChat?.appointmentId) return
    setExtendSubmitting(true)
    try {
      const response = await callApi(
        `/api/v1/appointments/${currentChat.appointmentId}/extend`,
        'PATCH',
        { additionalMinutes: minutes }
      )
      if (response.success) {
        const body = response.data
        const apt = body?.appointment || body
        if (apt?.slotEnd) {
          setCurrentChat((prev) => (prev ? { ...prev, slotEnd: apt.slotEnd } : prev))
        }
        setDismissedExtendForEndKey(null)
        setExtendModalOpen(false)
      } else {
        alert(response.error || 'Could not extend session')
      }
    } catch (e) {
      alert(e?.message || 'Could not extend session')
    } finally {
      setExtendSubmitting(false)
    }
  }

  const formatCountdown = (ms) => {
    if (ms == null || ms <= 0) return '0:00'
    const totalSec = Math.floor(ms / 1000)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      videoTrack.enabled = !videoTrack.enabled
      setCallControls(prev => ({ ...prev, video: videoTrack.enabled }))
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      audioTrack.enabled = !audioTrack.enabled
      setCallControls(prev => ({ ...prev, audio: audioTrack.enabled }))
    }
  }

  const shareScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const videoTrack = stream.getVideoTracks()[0]
      
      // Replace video track in peer connection
      const sender = peerConnectionRef.current.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      )
      
      if (sender) {
        await sender.replaceTrack(videoTrack)
      }

      setCallControls(prev => ({ ...prev, screenShare: true }))
      
      // Handle screen share end
      videoTrack.onended = () => {
        setCallControls(prev => ({ ...prev, screenShare: false }))
        // Switch back to camera
        const cameraTrack = localStreamRef.current.getVideoTracks()[0]
        if (sender && cameraTrack) {
          sender.replaceTrack(cameraTrack)
        }
      }
    } catch (error) {
      console.error('Error sharing screen:', error)
    }
  }

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file || !currentChat) return

    // Here you would typically upload the file to your server
    // and then send a message with the file URL
    console.log('File upload not implemented yet:', file)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we set up your chat session</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Single header: Back + title/participant + status + actions */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center min-w-0 flex-1">
            <button
              onClick={() => navigate(-1)}
              className="flex-shrink-0 text-gray-600 hover:text-gray-900 p-1 -ml-1 rounded"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            {currentChat ? (
              <div className="flex items-center gap-3 ml-3 min-w-0">
                <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-r from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {currentChat.partnerName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold text-gray-900 truncate">{currentChat.partnerName}</h1>
                  <p className="text-xs text-gray-500 capitalize">{currentChat.partnerRole}</p>
                </div>
              </div>
            ) : (
              <h1 className="text-lg font-semibold text-gray-900 ml-3">Chat Platform</h1>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            {currentChat && !inVideoCall && !localVideoTestActive && (
              <>
                {(currentChat.type !== 'appointment' ||
                  (currentChat.sessionMode === 'video' && getAppointmentSessionPhase() === 'active')) && (
                  <button
                    onClick={startVideoCall}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Video Call
                  </button>
                )}
                {currentChat.type !== 'appointment' && (
                  <button
                    onClick={startLocalVideoTest}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium border border-gray-200"
                    title="Test your camera and microphone"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                    Test Video
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {!currentChat ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active chat</h3>
              <p className="text-gray-600 text-sm">Open a chat from your appointments or booking to start a conversation.</p>
            </div>
          </div>
        ) : (
            <>
              {/* Typing indicator */}
              {otherUserTyping && (
                <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm text-gray-500 italic">{currentChat.partnerName} is typing...</p>
                </div>
              )}

              {currentChat?.type === 'appointment' && (() => {
                const phase = getAppointmentSessionPhase()
                const rem = getSessionRemainingMs()
                if (phase === 'unrestricted') return null
                return (
                  <div
                    className={`flex-shrink-0 px-4 py-3 text-sm border-b ${
                      phase === 'waiting'
                        ? 'bg-amber-50 text-amber-900 border-amber-100'
                        : phase === 'ended'
                          ? 'bg-rose-50 text-rose-900 border-rose-100'
                          : 'bg-teal-50 text-teal-900 border-teal-100'
                    }`}
                  >
                    {phase === 'waiting' && (
                      <p>
                        Your session opens at{' '}
                        <strong>{new Date(currentChat.slotStart).toLocaleString()}</strong>.
                        Chat and video are available only during your scheduled window.
                      </p>
                    )}
                    {phase === 'ended' && (
                      <p>This scheduled session has ended. Messaging and video are no longer available.</p>
                    )}
                    {phase === 'active' && (
                      <p>
                        {currentChat.sessionMode === 'video' ? 'Video session' : 'Online chat session'} — time
                        remaining: <strong>{formatCountdown(rem)}</strong>
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Messages Area */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50"
              >
                {messages.map((message, index) => {
                  const currentUserId = user?._id || user?.id
                  const isOwn = message.senderId === currentUserId || message.senderId?._id === currentUserId
                  const showDate = index === 0 || 
                    formatMessageDate(message.timestamp) !== formatMessageDate(messages[index - 1]?.timestamp)
                  
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex justify-center mb-4">
                          <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                            {formatMessageDate(message.timestamp)}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${
                          isOwn
                            ? 'bg-teal-600 text-white rounded-br-md'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                        }`}>
                          <p className="text-sm">{message.message}</p>
                          <div className={`flex items-center justify-end mt-1 text-xs ${
                            isOwn ? 'text-teal-100' : 'text-gray-500'
                          }`}>
                            <span>{formatMessageTime(message.timestamp)}</span>
                            {isOwn && message.sent && (
                              <span className="ml-1">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Input Area */}
              <div className="flex-shrink-0 bg-white border-t border-gray-200 p-3 sm:p-4">
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf,.doc,.docx" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={currentChat?.type === 'appointment' && getAppointmentSessionPhase() !== 'active'}
                    className="p-2.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Attach file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => { setInputMessage(e.target.value); handleTyping() }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Type your message..."
                    disabled={currentChat?.type === 'appointment' && getAppointmentSessionPhase() !== 'active'}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={
                      !inputMessage.trim() ||
                      (currentChat?.type === 'appointment' && getAppointmentSessionPhase() !== 'active')
                    }
                    className="px-5 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
      </div>

      {/* Session extension */}
      {extendModalOpen && currentChat?.type === 'appointment' && getAppointmentSessionPhase() === 'active' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Extend your session?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Your scheduled time is almost up. Choose how many extra minutes you need. The other participant
              will see the same updated end time.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {APPOINTMENT_EXTENSION_MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={extendSubmitting}
                  onClick={() => submitSessionExtension(m)}
                  className="py-2.5 px-2 text-sm font-medium rounded-xl bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200 disabled:opacity-50"
                >
                  +{m} min
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={dismissExtendModal}
              disabled={extendSubmitting}
              className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {/* Local Video Test modal */}
      {localVideoTestActive && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Camera preview</h3>
              <button
                onClick={closeLocalVideoTest}
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="aspect-video bg-gray-900">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
              <button onClick={closeLocalVideoTest} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {inVideoCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Video Call with {currentChat?.partnerName}</h3>
              <button
                onClick={endCall}
                className="text-red-600 hover:text-red-700"
              >
                End Call
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 h-[60vh]">
              {/* Remote Video */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                  {currentChat?.partnerName}
                </div>
              </div>
              
              {/* Local Video */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                  You
                </div>
              </div>
            </div>
            
            {/* Call Controls */}
            <div className="flex justify-center space-x-4 mt-6">
              <button
                type="button"
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-colors ${
                  callControls.audio 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {callControls.audio ? '🎤' : '🚫'}
              </button>
              
              <button
                type="button"
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  callControls.video 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {callControls.video ? '📹' : '🚫'}
              </button>
              
              {currentChat?.type !== 'appointment' && (
              <button
                type="button"
                onClick={shareScreen}
                className={`p-3 rounded-full transition-colors ${
                  callControls.screenShare 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📺
              </button>
              )}
              
              <button
                type="button"
                onClick={endCall}
                className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                📞
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                {incomingCall.senderName.charAt(0)}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Incoming {incomingCall.callType} call
              </h3>
              <p className="text-gray-600 mb-6">{incomingCall.senderName} is calling you</p>
              
              <div className="flex space-x-4">
                <button
                  onClick={rejectCall}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={acceptCall}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatPlatform