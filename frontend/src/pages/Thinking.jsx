import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

const STEPS = [
  { key: 'classify', label: 'Classifying your crisis...', sublabel: 'Identifying task type and urgency' },
  { key: 'artifact', label: 'Generating your rescue artifact...', sublabel: 'Creating actual work content for you' },
  { key: 'sprint', label: 'Building your sprint plan...', sublabel: 'Breaking it into timed action blocks' },
  { key: 'calendar', label: 'Booking calendar sprints...', sublabel: 'Scheduling blocks on Google Calendar' },
]

export default function Thinking() {
  const location = useLocation()
  const navigate = useNavigate()
  const message = location.state?.message || ''
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!message) { navigate('/'); return }
    callRescueAPI()
  }, [])

  const callRescueAPI = async () => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => prev < 2 ? prev + 1 : prev)
    }, 4000)

    try {
      const response = await axios.post('http://127.0.0.1:8000/rescue', { message })
      clearInterval(stepInterval)
      setCurrentStep(3)
      setTimeout(() => {
        navigate('/dashboard', { state: { data: response.data, message } })
      }, 1000)
    } catch (err) {
      clearInterval(stepInterval)
      setError(err.response?.data?.detail || 'Something went wrong. Try again.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⚡</div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Agent is working...</h2>
        <p style={{ color: '#888', fontSize: '14px', maxWidth: '400px' }}>"{message.slice(0, 80)}{message.length > 80 ? '...' : ''}"</p>
      </div>

      <div style={{ width: '100%', maxWidth: '480px' }}>
        {STEPS.map((step, i) => {
          const isDone = i < currentStep
          const isActive = i === currentStep
          const isPending = i > currentStep
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', opacity: isPending ? 0.3 : 1, transition: 'opacity 0.5s' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                background: isDone ? '#16a34a' : isActive ? '#e53e3e22' : '#1a1a1a',
                border: `2px solid ${isDone ? '#16a34a' : isActive ? '#e53e3e' : '#2a2a2a'}`,
                transition: 'all 0.5s'
              }}>
                {isDone ? '✓' : isActive ? <span style={{ animation: 'pulse 1s infinite' }}>●</span> : '○'}
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: isActive ? '600' : '400', color: isActive ? '#f0f0f0' : isDone ? '#16a34a' : '#888' }}>{step.label}</p>
                <p style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{step.sublabel}</p>
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div style={{ marginTop: '24px', padding: '16px', background: '#e53e3e22', border: '1px solid #e53e3e', borderRadius: '12px', maxWidth: '480px', width: '100%' }}>
          <p style={{ color: '#e53e3e', fontSize: '14px' }}>{error}</p>
          <button onClick={() => navigate('/')} style={{ marginTop: '12px', color: '#e53e3e', background: 'none', fontSize: '13px', textDecoration: 'underline' }}>
            Go back and try again
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  )
}