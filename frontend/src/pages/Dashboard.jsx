import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const data = location.state?.data
  const message = location.state?.message

  const [activeTab, setActiveTab] = useState('artifact')
  const [sprintTimers, setSprintTimers] = useState({})
  const [completedSprints, setCompletedSprints] = useState([])
  const [calendarBooked, setCalendarBooked] = useState(false)
  const [authUrl, setAuthUrl] = useState('')

  useEffect(() => {
    if (!data) navigate('/')
    fetchAuthUrl()
  }, [])

  const fetchAuthUrl = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/auth/google')
      const json = await res.json()
      setAuthUrl(json.auth_url)
    } catch {}
  }

  const bookCalendar = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/book-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprints: data.sprint_plan })
      })
      const json = await res.json()
      if (json.success) setCalendarBooked(true)
    } catch {
      if (authUrl) window.open(authUrl, '_blank')
    }
  }

  const toggleSprint = (i) => {
    setCompletedSprints(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    )
  }

  if (!data) return null

  const urgencyColor = data.urgency_level === 'critical' ? '#e53e3e' : data.urgency_level === 'high' ? '#d97706' : '#16a34a'
  const totalMinutes = data.sprint_plan?.reduce((acc, s) => acc + s.duration_minutes, 0) || 0

  return (
    <div style={{ minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ padding: '4px 10px', background: urgencyColor + '22', border: `1px solid ${urgencyColor}`, borderRadius: '99px', fontSize: '11px', color: urgencyColor, fontWeight: '600', textTransform: 'uppercase' }}>
                {data.urgency_level} urgency
              </span>
              <span style={{ padding: '4px 10px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '99px', fontSize: '11px', color: '#888' }}>
                {data.task_type}
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Rescue Plan: {data.topic}</h1>
            <p style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>{data.agent_message}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{ padding: '8px 16px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#888', fontSize: '13px' }}
          >
            ← New Crisis
          </button>
        </div>

        {/* Stats Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Time', value: `${totalMinutes} min` },
            { label: 'Sprints', value: data.sprint_plan?.length || 0 },
            { label: 'Completed', value: `${completedSprints.length}/${data.sprint_plan?.length || 0}` }
          ].map((stat, i) => (
            <div key={i} style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#f0f0f0' }}>{stat.value}</p>
              <p style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#141414', padding: '4px', borderRadius: '10px', border: '1px solid #2a2a2a' }}>
          {['artifact', 'sprints'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: '500',
                background: activeTab === tab ? '#2a2a2a' : 'transparent',
                color: activeTab === tab ? '#f0f0f0' : '#888',
                transition: 'all 0.2s', textTransform: 'capitalize'
              }}
            >
              {tab === 'artifact' ? '📄 Rescue Artifact' : '⚡ Sprint Tracker'}
            </button>
          ))}
        </div>

        {/* Artifact Tab */}
        {activeTab === 'artifact' && (
          <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Your Rescue Content</h2>
              <span style={{ fontSize: '12px', color: '#555' }}>Generated by Clutch AI</span>
            </div>
            <div style={{
              color: '#d0d0d0', lineHeight: '1.8', fontSize: '14px',
              borderTop: '1px solid #2a2a2a', paddingTop: '20px'
            }}>
              <ReactMarkdown
                components={{
                  h1: ({children}) => <h1 style={{ fontSize: '20px', fontWeight: '700', margin: '20px 0 10px', color: '#f0f0f0' }}>{children}</h1>,
                  h2: ({children}) => <h2 style={{ fontSize: '17px', fontWeight: '600', margin: '18px 0 8px', color: '#e0e0e0' }}>{children}</h2>,
                  h3: ({children}) => <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '14px 0 6px', color: '#d0d0d0' }}>{children}</h3>,
                  p: ({children}) => <p style={{ marginBottom: '10px' }}>{children}</p>,
                  ul: ({children}) => <ul style={{ paddingLeft: '20px', marginBottom: '10px' }}>{children}</ul>,
                  li: ({children}) => <li style={{ marginBottom: '4px' }}>{children}</li>,
                  strong: ({children}) => <strong style={{ color: '#f0f0f0', fontWeight: '600' }}>{children}</strong>,
                  code: ({children}) => <code style={{ background: '#2a2a2a', padding: '2px 6px', borderRadius: '4px', fontSize: '13px', color: '#d97706' }}>{children}</code>,
                }}
              >
                {data.artifact_content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Sprints Tab */}
        {activeTab === 'sprints' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Sprint Blocks</h2>
              <button
                onClick={bookCalendar}
                style={{
                  padding: '8px 16px', background: calendarBooked ? '#16a34a22' : '#2563eb',
                  border: `1px solid ${calendarBooked ? '#16a34a' : '#2563eb'}`,
                  borderRadius: '8px', color: calendarBooked ? '#16a34a' : 'white',
                  fontSize: '13px', fontWeight: '600', transition: 'all 0.2s'
                }}
              >
                {calendarBooked ? '✓ Booked on Calendar' : '📅 Book on Google Calendar'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.sprint_plan?.map((sprint, i) => {
                const isDone = completedSprints.includes(i)
                return (
                  <div
                    key={i}
                    style={{
                      background: isDone ? '#16a34a11' : '#141414',
                      border: `1px solid ${isDone ? '#16a34a' : '#2a2a2a'}`,
                      borderRadius: '12px', padding: '16px',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', color: '#555', fontWeight: '600' }}>SPRINT {i + 1}</span>
                          <span style={{ fontSize: '12px', padding: '2px 8px', background: '#2a2a2a', borderRadius: '99px', color: '#888' }}>
                            {sprint.duration_minutes} min
                          </span>
                        </div>
                        <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: isDone ? '#16a34a' : '#f0f0f0', textDecoration: isDone ? 'line-through' : 'none' }}>
                          {sprint.title}
                        </p>
                        <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.5' }}>{sprint.goal}</p>
                      </div>
                      <button
                        onClick={() => toggleSprint(i)}
                        style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: isDone ? '#16a34a' : '#1a1a1a',
                          border: `2px solid ${isDone ? '#16a34a' : '#2a2a2a'}`,
                          color: isDone ? 'white' : '#555', fontSize: '16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isDone ? '✓' : '○'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}