import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Landing() {
  const [message, setMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const recognitionRef = useRef(null)

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.onresult = (e) => {
        setMessage(e.results[0][0].transcript)
        setIsListening(false)
      }
      recognitionRef.current.onend = () => setIsListening(false)
    }
  }, [])

  const toggleVoice = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleRescue = async () => {
    if (!message.trim()) {
      setError('Tell me your crisis first.')
      return
    }
    setError('')
    navigate('/thinking', { state: { message } })
  }

  const examples = [
    "I have 3 hours before my DBMS exam and haven't covered transactions",
    "Client proposal due in 2 hours, haven't started",
    "Presentation tomorrow morning, no slides yet",
    "Job interview in 90 minutes, know nothing about the company"
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#e53e3e', boxShadow: '0 0 12px #e53e3e', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '13px', color: '#e53e3e', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Crisis Mode Active</span>
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '12px' }}>
          Clutch<span style={{ color: '#e53e3e' }}>.</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#888', maxWidth: '400px' }}>
          You're behind. Let's fix that. Tell me your deadline crisis.
        </p>
      </div>

      {/* Input Area */}
      <div style={{ width: '100%', maxWidth: '640px', marginBottom: '24px' }}>
        <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. I have 4 hours before my ML exam and haven't covered neural networks..."
            style={{
              width: '100%', background: 'transparent', border: 'none',
              color: '#f0f0f0', fontSize: '16px', lineHeight: '1.6',
              resize: 'none', minHeight: '100px', fontFamily: 'inherit'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) handleRescue()
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <button
              onClick={toggleVoice}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: isListening ? '#e53e3e22' : '#1a1a1a',
                border: `1px solid ${isListening ? '#e53e3e' : '#2a2a2a'}`,
                borderRadius: '8px', padding: '8px 16px',
                color: isListening ? '#e53e3e' : '#888', fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              <span>{isListening ? '⏹ Stop' : '🎙 Speak'}</span>
              {isListening && <span style={{ color: '#e53e3e' }}>● Recording...</span>}
            </button>
            <span style={{ fontSize: '12px', color: '#555' }}>Ctrl+Enter to rescue</span>
          </div>
        </div>

        {error && <p style={{ color: '#e53e3e', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}

        <button
          onClick={handleRescue}
          style={{
            width: '100%', padding: '16px', background: '#e53e3e',
            color: 'white', fontSize: '16px', fontWeight: '700',
            borderRadius: '12px', letterSpacing: '0.02em',
            transition: 'all 0.2s', textTransform: 'uppercase'
          }}
          onMouseEnter={e => e.target.style.background = '#c53030'}
          onMouseLeave={e => e.target.style.background = '#e53e3e'}
        >
          🚨 Rescue Me Now
        </button>
      </div>

      {/* Examples */}
      <div style={{ width: '100%', maxWidth: '640px' }}>
        <p style={{ fontSize: '12px', color: '#555', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Try an example</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => setMessage(ex)}
              style={{
                textAlign: 'left', padding: '12px 16px',
                background: '#141414', border: '1px solid #2a2a2a',
                borderRadius: '8px', color: '#888', fontSize: '13px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#e53e3e'; e.target.style.color = '#f0f0f0' }}
              onMouseLeave={e => { e.target.style.borderColor = '#2a2a2a'; e.target.style.color = '#888' }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}