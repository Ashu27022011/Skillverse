
import { useEffect, useMemo, useRef, useState } from 'react'
import useSound from 'use-sound'
import './index.css'
import SignupCreatePage from './Signup_createpage.jsx'
import CreateAccountPage from './create_account.jsx'
import LoginPage from './LoginPage.jsx'
import PageFooter from './PageFooter.jsx'

import aerospaceImage from './assets/slider-images/aerospace.avif'
import codingImage from './assets/slider-images/coding.jpg'
import mathImage from './assets/slider-images/Math.jpg'
import cloudsImage from './assets/slider-images/science behind clouds.jfif'
import scienceImage from './assets/slider-images/Science.jpg'

const slides = [
  {
    title: ['Rocket', 'Science'],
    description: 'From the first spark of flight to spacecraft at the edge of possibility—learn how bold ideas take off.',
    image: aerospaceImage,
    className: 'aerospace',
  },
  {
    title: ['The Science', 'Behind Clouds'],
    description: 'Read the sky differently. Uncover the atmospheric forces that turn tiny droplets into dramatic weather.',
    image: cloudsImage,
    className: 'clouds',
  },
  {
    title: ['Science', 'That Shapes Us'],
    description: 'Follow curiosity into the living, moving world around you—where every observation opens a new question.',
    image: scienceImage,
    className: 'science',
  },
  {
    title: ['The Art', 'of Mathematics'],
    description: 'Find clarity in patterns, possibility in numbers, and the quiet confidence that comes from solving.',
    image: mathImage,
    className: 'math',
  },
  {
    title: ['Build With', 'Code'],
    description: 'Turn a blank screen into something useful. Start with the logic, then make it beautifully your own.',
    image: codingImage,
    className: 'coding',
  },
  {
    title: ['100+ Skills', 'Available'],
    description: 'A growing library of workshops designed to make the next thing you learn your favourite thing yet.',
    className: 'skills',
    summary: true,
  },
]

const skillAliases = {
  pyhton: 'python',
  pythn: 'python',
  reactjs: 'react',
  frontend: 'web development',
  'front end': 'web development',
  'web dev': 'web development',
  design: 'graphic design',
  speaking: 'public speaking',
  photoshop: 'graphic design',
}

const searchAccents = ['#ffae35', '#2bb6a8', '#3174e7', '#e65fa5', '#a5f03d', '#a564f5']
const API_BASE = 'http://127.0.0.1:8000/api/accounts'

const normalize = (value) => value.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ')
const normalizeSearchTerm = (value) => normalize(value).replace(/s$/, '')
const resolveMediaUrl = (value) => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return new URL(value, `${API_BASE}/`).toString()
}

const profileFromApi = (profile) => ({
  ...profile,
  name: profile.username,
  role: profile.username === 'Gaddam Ashutosh Reddy' ? 'Website builder' : 'Skillverse member',
  location: 'Skillverse',
  bio: profile.bio || 'Learning and sharing skills with the Skillverse community.',
  skills: (profile.skills || []).map((skill) => typeof skill === 'string' ? skill : skill.name),
  image: resolveMediaUrl(profile.avatar),
})

function ProfileModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({ username: profile.username || '', email: profile.email || '', bio: profile.bio || '', skills: profile.skills || [] })
  const [skillInput, setSkillInput] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(profile.image || '')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const addSkill = () => {
    const skill = skillInput.trim()
    if (!skill || form.skills.includes(skill)) return
    setForm((current) => ({ ...current, skills: [...current.skills, skill] }))
    setSkillInput('')
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    const token = localStorage.getItem('access_token')
    setIsSaving(true)
    setError('')
    const payload = new FormData()
    payload.append('username', form.username.trim())
    payload.append('email', form.email.trim())
    payload.append('bio', form.bio)
    form.skills.forEach((skill) => payload.append('skills', skill))
    if (avatar) payload.append('avatar', avatar)
    try {
      const response = await fetch(`${API_BASE}/me/`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: payload })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || data.username?.[0] || data.email?.[0] || 'Unable to save your profile.')
      onSaved(profileFromApi(data))
      onClose()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
    <button className="profile-modal-close" type="button" onClick={onClose} aria-label="Close profile editor">×</button>
    <div className="profile-modal-heading"><p className="eyebrow">Account settings</p><h2 id="profile-modal-title">Your profile</h2><p>Keep your Skillverse profile current.</p></div>
    <form className="profile-edit-form" onSubmit={saveProfile}>
      <label className="profile-edit-avatar"><img src={avatarPreview || '/Logo_main.png'} alt="Profile" onError={(event) => { event.currentTarget.src = '/Logo_main.png' }} /><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setAvatar(file); setAvatarPreview(URL.createObjectURL(file)) } }} /><span>Change photo</span></label>
      <label className="modal-field"><span>Username</span><input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} /></label>
      <label className="modal-field"><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
      <label className="modal-field"><span>Description</span><textarea maxLength={500} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} /></label>
      <div className="modal-field"><span>Skills</span><div className="modal-skill-input"><input value={skillInput} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSkill() } }} placeholder="Add a skill" /><button type="button" onClick={addSkill}>Add</button></div><div className="modal-skill-list">{form.skills.map((skill) => <span key={skill}>{skill}<button type="button" onClick={() => setForm((current) => ({ ...current, skills: current.skills.filter((item) => item !== skill) }))} aria-label={`Remove ${skill}`}>×</button></span>)}</div></div>
      {error && <p className="profile-modal-error" role="alert">{error}</p>}
      <button className="profile-save-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
    </form>
  </section></div>
}

function scoreProfile(profile, query) {
  const normalizedQuery = normalize(query)
  const expandedQuery = skillAliases[normalizedQuery] || normalizedQuery
  const queryTerms = expandedQuery.split(' ').filter((term) => term.length > 1).map(normalizeSearchTerm)
  const searchableSkills = profile.skills.map((skill) => normalize(skill))
  const exactSkillMatch = searchableSkills.some((skill) => skill === expandedQuery || normalizeSearchTerm(skill) === normalizeSearchTerm(expandedQuery))
  if (exactSkillMatch) return 120
  const skillMatch = searchableSkills.some((skill) => queryTerms.every((term) => normalizeSearchTerm(skill).includes(term)))
  if (skillMatch) return 100
  const relatedSkillMatch = searchableSkills.some((skill) => queryTerms.some((term) => term.length > 2 && normalizeSearchTerm(skill).includes(term)))
  if (relatedSkillMatch) return 80
  const searchableText = normalize(`${profile.name} ${profile.role} ${profile.bio}`)
  if (searchableText.includes(normalizedQuery)) return 65
  if (queryTerms.some((term) => term.length > 2 && searchableText.includes(term))) return 40
  return 0
}

function createToneDataUri(frequency, duration = 0.14) {
  const sampleRate = 8000
  const sampleCount = Math.floor(sampleRate * duration)
  const bytes = new Uint8Array(44 + sampleCount * 2)
  const view = new DataView(bytes.buffer)
  const writeText = (offset, text) => [...text].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)))
  writeText(0, 'RIFF')
  view.setUint32(4, 36 + sampleCount * 2, true)
  writeText(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeText(36, 'data')
  view.setUint32(40, sampleCount * 2, true)
  for (let index = 0; index < sampleCount; index += 1) {
    const envelope = Math.min(1, index / 160, (sampleCount - index) / 900)
    view.setInt16(44 + index * 2, Math.sin((index / sampleRate) * Math.PI * 2 * frequency) * 7000 * envelope, true)
  }
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return `data:audio/wav;base64,${window.btoa(binary)}`
}

function SkillizingModal({ profile, onClose, onComplete }) {
  const [learnedSkill, setLearnedSkill] = useState('')
  const [taughtSkill, setTaughtSkill] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitExchange = async (event) => {
    event.preventDefault()
    if (!learnedSkill.trim() || !taughtSkill.trim()) {
      setError('Add one skill you learned and one skill you taught.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/conversations/${encodeURIComponent(profile.username)}/skillizing/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ learned_skill: learnedSkill, taught_skill: taughtSkill }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Unable to save this skill exchange.')
      onComplete(data, { learnedSkill: learnedSkill.trim(), taughtSkill: taughtSkill.trim() })
      onClose()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="profile-modal skillizing-modal" role="dialog" aria-modal="true" aria-labelledby="skillizing-title">
    <button className="profile-modal-close" type="button" onClick={onClose} aria-label="Close Skillizing">×</button>
    <div className="profile-modal-heading"><p className="eyebrow">Skill exchange</p><h2 id="skillizing-title">Skill learned</h2><p>Tell us what you learned and what you taught {profile.name}.</p></div>
    <form className="profile-edit-form" onSubmit={submitExchange}>
      <label className="modal-field"><span>Learned skill</span><input value={learnedSkill} onChange={(event) => setLearnedSkill(event.target.value)} placeholder="Example: JavaScript" /></label>
      <label className="modal-field"><span>Taught skill</span><input value={taughtSkill} onChange={(event) => setTaughtSkill(event.target.value)} placeholder="Example: Design" /></label>
      {error && <p className="profile-modal-error" role="alert">{error}</p>}
      <button className="profile-save-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Submit exchange'}</button>
    </form>
  </section></div>
}

function CertificateModal({ certificate, username, onClose }) {
  const certificateDate = new Date(certificate.completedAt).toLocaleDateString()
  const escapeXml = (value) => String(value).replace(/[<>&'"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character])
  const safeUsername = escapeXml(username)
  const safeLearnedSkill = escapeXml(certificate.learnedSkill)
  const safeTaughtSkill = escapeXml(certificate.taughtSkill)
  const certificateMarkup = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850">
  <rect width="1200" height="850" fill="#f6f0df"/>
  <rect x="34" y="34" width="1132" height="782" rx="10" fill="none" stroke="#24483e" stroke-width="8"/>
  <rect x="58" y="58" width="1084" height="734" rx="6" fill="none" stroke="#c5954d" stroke-width="2"/>
  <text x="600" y="180" text-anchor="middle" fill="#24483e" font-family="Georgia, serif" font-size="58" font-weight="bold">Skillverse</text>
  <text x="600" y="255" text-anchor="middle" fill="#7a5d35" font-family="Arial, sans-serif" font-size="22" letter-spacing="5">CERTIFICATE OF SKILL EXCHANGE</text>
  <text x="600" y="350" text-anchor="middle" fill="#35433e" font-family="Arial, sans-serif" font-size="24">This certificate recognizes</text>
  <text x="600" y="430" text-anchor="middle" fill="#24483e" font-family="Georgia, serif" font-size="48" font-weight="bold">${safeUsername}</text>
  <text x="600" y="500" text-anchor="middle" fill="#35433e" font-family="Arial, sans-serif" font-size="22">for completing a verified exchange in</text>
  <text x="600" y="555" text-anchor="middle" fill="#7a5d35" font-family="Arial, sans-serif" font-size="25" font-weight="bold">${safeLearnedSkill} and ${safeTaughtSkill}</text>
  <text x="600" y="645" text-anchor="middle" fill="#35433e" font-family="Arial, sans-serif" font-size="18">Completed on ${certificateDate}  |  100 experience points awarded</text>
  <path d="M380 710h190M630 710h190" stroke="#24483e" stroke-width="2"/>
  <text x="475" y="745" text-anchor="middle" fill="#7a5d35" font-family="Arial, sans-serif" font-size="15">Skillverse Community</text>
  <text x="725" y="745" text-anchor="middle" fill="#7a5d35" font-family="Arial, sans-serif" font-size="15">Verified exchange</text>
</svg>`

  const downloadCertificate = () => {
    const blob = new Blob([certificateMarkup], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `skillverse-certificate-${certificate.learnedSkill.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`
    link.click()
    URL.revokeObjectURL(url)
  }

  return <div className="certificate-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="certificate-modal" role="dialog" aria-modal="true" aria-labelledby="certificate-title">
    <button className="profile-modal-close" type="button" onClick={onClose} aria-label="Close certificate preview">×</button>
    <div className="certificate-heading"><p className="eyebrow">Exchange complete</p><h2 id="certificate-title">Your certificate is ready</h2><p>Preview your verified Skillverse learning exchange.</p></div>
    <div className="certificate-preview" dangerouslySetInnerHTML={{ __html: certificateMarkup.replace(/^<\?xml[^>]+>\s*/, '') }} />
    <button className="profile-save-button certificate-download" type="button" onClick={downloadCertificate}>Download certificate</button>
  </section></div>
}

function ChatWorkspace({ profile, currentUsername, onExperienceAwarded }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isCreatingMeet, setIsCreatingMeet] = useState(false)
  const [isSkillizingVisible, setIsSkillizingVisible] = useState(false)
  const [isSkillizingEligible, setIsSkillizingEligible] = useState(false)
  const [isSkillizingComplete, setIsSkillizingComplete] = useState(false)
  const [certificate, setCertificate] = useState(null)
  const [notice, setNotice] = useState('')
  const [isContactActive, setIsContactActive] = useState(false)
  const [isDetailsVisible, setIsDetailsVisible] = useState(false)
  const contactButtonRef = useRef(null)
  const contactDetailsRef = useRef(null)
  const messagesEndRef = useRef(null)
  const knownMessageIdsRef = useRef(new Set())
  const hasLoadedMessagesRef = useRef(false)
  const username = profile.username || normalize(profile.name).replace(/ /g, '_')
  const [playSentSound] = useSound(createToneDataUri(740), { volume: 0.24 })
  const [playReceivedSound] = useSound(createToneDataUri(540, 0.18), { volume: 0.2 })

  useEffect(() => {
    const loadMessages = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setNotice('Sign in to sync messages and attachments with the backend.')
        setIsLoading(false)
        return
      }
      try {
        const response = await fetch(`${API_BASE}/conversations/${encodeURIComponent(username)}/messages/`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.detail || 'This profile is not connected to a backend account yet.')
        const nextMessages = [...(data.messages || [])].sort((first, second) => new Date(first.created_at) - new Date(second.created_at))
        const newIncomingMessage = hasLoadedMessagesRef.current && nextMessages.some((message) => !knownMessageIdsRef.current.has(message.id) && message.sender !== currentUsername)
        if (newIncomingMessage) playReceivedSound()
        knownMessageIdsRef.current = new Set(nextMessages.map((message) => message.id))
        hasLoadedMessagesRef.current = true
        setMessages(nextMessages)
        const profileResponse = await fetch(`${API_BASE}/profiles/?q=${encodeURIComponent(username)}`, { headers: { Authorization: `Bearer ${token}` } })
        const profilesData = await profileResponse.json().catch(() => [])
        const contact = profilesData.find((item) => item.username === username)
        setIsContactActive(Boolean(contact))
      } catch (error) {
        setNotice(error.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadMessages()
    const poll = window.setInterval(loadMessages, 2500)
    return () => window.clearInterval(poll)
  }, [username, currentUsername, playReceivedSound])

  useEffect(() => {
    const checkSkillizing = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) return
      const response = await fetch(`${API_BASE}/conversations/${encodeURIComponent(username)}/skillizing/`, { headers: { Authorization: `Bearer ${token}` } })
      if (response.ok) {
        const data = await response.json()
        setIsSkillizingEligible(data.eligible)
        setIsSkillizingComplete(data.completed)
      }
    }
    checkSkillizing().catch(() => undefined)
    const poll = window.setInterval(() => checkSkillizing().catch(() => undefined), 10000)
    return () => window.clearInterval(poll)
  }, [username])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isDetailsVisible) return undefined
    const closeDetailsOnOutsideClick = (event) => {
      if (contactDetailsRef.current?.contains(event.target) || contactButtonRef.current?.contains(event.target)) return
      setIsDetailsVisible(false)
    }
    document.addEventListener('pointerdown', closeDetailsOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeDetailsOnOutsideClick)
  }, [isDetailsVisible])

  const sendMessage = async (event) => {
    event.preventDefault()
    if (!draft.trim() && !attachment) return
    const token = localStorage.getItem('access_token')
    setIsSending(true)
    setNotice('')
    const formData = new FormData()
    formData.append('body', draft.trim())
    if (attachment) formData.append('attachment', attachment)

    try {
      if (!token) throw new Error('Sign in to send synced messages.')
      const response = await fetch(`${API_BASE}/conversations/${encodeURIComponent(username)}/messages/`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Unable to send this message.')
      const sentMessages = data.messages || [data]
      setMessages((current) => [...current, ...sentMessages])
      sentMessages.forEach((message) => knownMessageIdsRef.current.add(message.id))
      playSentSound()
      setDraft('')
      setAttachment(null)
      event.target.reset()
    } catch (error) {
      setNotice(error.message)
    } finally {
      setIsSending(false)
    }
  }

  const createMeetAndSend = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setNotice('Sign in to create a Google Meet link.')
      return
    }
    setIsCreatingMeet(true)
    setNotice('')
    try {
      const meetResponse = await fetch(`${API_BASE}/conversations/${encodeURIComponent(username)}/meet/`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const meetData = await meetResponse.json().catch(() => ({}))
      if (!meetResponse.ok) throw new Error(meetData.detail || 'Google Meet is not available right now.')
      const messageResponse = await fetch(`${API_BASE}/conversations/${encodeURIComponent(username)}/messages/`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ body: `Google Meet invitation: ${meetData.url}` }) })
      const messageData = await messageResponse.json().catch(() => ({}))
      if (!messageResponse.ok) throw new Error(messageData.detail || 'The Meet link was created but could not be sent.')
      const sentMessages = messageData.messages || [messageData]
      setMessages((current) => [...current, ...sentMessages])
      sentMessages.forEach((message) => knownMessageIdsRef.current.add(message.id))
      playSentSound()
    } catch (error) {
      setNotice(error.message)
    } finally {
      setIsCreatingMeet(false)
    }
  }

  return <section className="chat-workspace" aria-label={`Chat with ${profile.name}`}>
    <div className="chat-panel">
      <header className="chat-header"><button ref={contactButtonRef} className="chat-contact-button" type="button" onClick={() => setIsDetailsVisible((current) => !current)} aria-label="Show contact details" aria-expanded={isDetailsVisible}><img src={profile.image} alt="" /><span className="chat-contact-copy"><strong>{profile.name}</strong><span>{profile.role}</span></span></button><div className="chat-header-actions"><span className={`chat-status ${isContactActive ? 'active' : 'offline'}`}>{isContactActive ? 'Active now' : 'Offline'}</span>{isSkillizingEligible && !isSkillizingComplete && <button className="skillizing-button" type="button" onClick={() => setIsSkillizingVisible(true)}>Skillizing</button>}</div></header>
      {isDetailsVisible && <aside ref={contactDetailsRef} className="chat-contact-details"><button className="details-close" type="button" onClick={() => setIsDetailsVisible(false)} aria-label="Close contact details">×</button><img src={profile.image} alt={`${profile.name} profile`} /><p className="eyebrow">Contact details</p><h2>{profile.name}</h2><p className="chat-profile-role">{profile.role} / {profile.location}</p><p>{profile.bio}</p><div className="skill-tags">{profile.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></aside>}
      <div className="chat-messages" aria-live="polite">
        {isLoading && <p className="chat-empty">Loading conversation...</p>}
        {!isLoading && messages.length === 0 && <p className="chat-empty">Start a conversation with {profile.name.split(' ')[0]}.</p>}
        {messages.map((message) => { const outgoing = message.sender === currentUsername; return <div className={`chat-message ${outgoing ? 'outgoing' : 'incoming'}`} key={message.id || `${message.created_at}-${message.body}`}><p>{message.body}</p>{message.attachment_url && <a href={message.attachment_url} target="_blank" rel="noreferrer">{message.attachment?.split('/').pop() || 'Attached file'}</a>}<time>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div> })}
        <div ref={messagesEndRef} />
      </div>
      {notice && <p className="chat-notice" role="status">{notice}</p>}
      {attachment && <div className="attachment-preview">Attached: {attachment.name}<button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment">×</button></div>}
      <form className="chat-composer" onSubmit={sendMessage}>
        <label className="chat-attach" aria-label="Attach a file"><input type="file" onChange={(event) => setAttachment(event.target.files?.[0] || null)} /><Icon name="plus" size={20} /></label>
        <button className="chat-meet-button" type="button" onClick={createMeetAndSend} disabled={isCreatingMeet} aria-label="Create and send Google Meet link" title="Create Google Meet"><Icon name="meet" size={19} /></button>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type a message" aria-label="Message" />
        <button className="chat-send-button" type="submit" disabled={isSending || (!draft.trim() && !attachment)} aria-label="Send message"><Icon name="send" size={18} /></button>
      </form>
      {isSkillizingVisible && <SkillizingModal profile={profile} onClose={() => setIsSkillizingVisible(false)} onComplete={(data, skills) => { setIsSkillizingComplete(data.completed); if (data.experience_awarded) onExperienceAwarded?.(data.experience); if (data.completed) setCertificate({ ...skills, completedAt: new Date().toISOString() }) }} />}
      {certificate && <CertificateModal certificate={certificate} username={currentUsername} onClose={() => setCertificate(null)} />}
    </div>
  </section>
}

function SearchResults({ profiles, query, accent, onClear, onOpenChat }) {
  const [focusedProfile, setFocusedProfile] = useState(null)
  const [hoverTimer, setHoverTimer] = useState(null)
  const results = useMemo(() => {
    const ranked = profiles.map((profile) => ({ ...profile, score: scoreProfile(profile, query) })).filter((profile) => profile.score > 0).sort((a, b) => b.score - a.score)
    return ranked.length ? ranked : profiles.slice(0, 4).map((profile) => ({ ...profile, relatedFallback: true }))
  }, [profiles, query])

  const beginHover = (profile) => {
    const timer = window.setTimeout(() => setFocusedProfile(profile), 3000)
    setHoverTimer(timer)
  }

  const endHover = () => {
    if (hoverTimer) window.clearTimeout(hoverTimer)
    setHoverTimer(null)
  }

  return <section className={`search-results ${focusedProfile ? 'has-focus' : ''}`} style={{ '--search-accent': accent }} aria-live="polite">
    <div className="results-heading">
      <div><p className="eyebrow">{results.length} people found</p><h1>Results: <em>{query}</em></h1></div>
      <button className="clear-search" type="button" onClick={onClear}>Back to explore</button>
    </div>
    <div className="profile-grid">
      {results.map((profile) => <article className={`profile-card ${focusedProfile?.name === profile.name ? 'focused' : ''}`} key={profile.name} onMouseEnter={() => beginHover(profile)} onMouseLeave={endHover} onFocus={() => beginHover(profile)} onBlur={endHover} onClick={() => onOpenChat(profile)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpenChat(profile) } }} tabIndex="0">
        <img src={profile.image} alt={`${profile.name} profile`} />
        <div className="profile-card-content"><p className="profile-role">{profile.role} / {profile.location}</p><h2>{profile.name}</h2><p className="profile-bio">{profile.bio}</p><div className="skill-tags">{profile.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>
      </article>)}
    </div>
    {focusedProfile && <div className="profile-focus-backdrop" role="presentation" onClick={() => setFocusedProfile(null)}><article className="profile-focus" role="dialog" aria-modal="true" aria-label={`${focusedProfile.name} details`} onClick={(event) => event.stopPropagation()}><button className="focus-close" type="button" onClick={() => setFocusedProfile(null)} aria-label="Close profile">×</button><img src={focusedProfile.image} alt={`${focusedProfile.name} profile`} /><div><p className="eyebrow">Profile spotlight</p><h2>{focusedProfile.name}</h2><p className="focus-role">{focusedProfile.role} / {focusedProfile.location}</p><p>{focusedProfile.bio}</p><div className="skill-tags">{focusedProfile.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><button className="connect-button" type="button" onClick={() => onOpenChat(focusedProfile)}>Connect with {focusedProfile.name.split(' ')[0]}</button></div></article></div>}
  </section>
}

function Inbox({ currentUsername, profiles, initialProfile, onUnreadChange, onExperienceAwarded }) {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [selectedProfile, setSelectedProfile] = useState(initialProfile || null)
  useEffect(() => {
    const loadInbox = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) return
      const response = await fetch(`${API_BASE}/inbox/`, { headers: { Authorization: `Bearer ${token}` } })
      if (response.ok) {
        const nextItems = await response.json()
        const orderedItems = [...nextItems].sort((first, second) => new Date(second.last_message_at || 0) - new Date(first.last_message_at || 0))
        setItems(orderedItems)
        setSelectedProfile((current) => current || orderedItems[0] || null)
        onUnreadChange(orderedItems.reduce((total, item) => total + (item.unread_count || 0), 0))
      }
    }
    loadInbox()
    const poll = window.setInterval(loadInbox, 3000)
    return () => window.clearInterval(poll)
  }, [currentUsername, onUnreadChange])

  const normalizedQuery = normalize(query)
  const visibleItems = items.filter((item) => normalize(`${item.name} ${item.last_message}` ).includes(normalizedQuery))
  const discoveredProfiles = normalizedQuery ? profiles.filter((profile) => normalize(`${profile.name} ${profile.role} ${profile.skills.join(' ')}`).includes(normalizedQuery) && !items.some((item) => item.username === profile.username)) : []

  const openProfile = (item) => {
    const nextProfile = profiles.find((profile) => profile.username === item.username) || { ...item, name: item.name, image: resolveMediaUrl(item.avatar), role: 'Skillverse member', location: 'Skillverse', skills: item.skills || [], bio: item.bio || '' }
    setSelectedProfile(nextProfile)
  }

  return <section className="inbox-view" aria-label="Chats">
    <div className="inbox-heading"><h1>Chats</h1><label className="inbox-search"><Icon name="search" size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chats or people" aria-label="Search chats or people" /></label></div>
    <div className="inbox-sidebar">
      {items.length === 0 && !normalizedQuery && <p className="inbox-empty">No conversations yet. Search for someone and send a message.</p>}
      {normalizedQuery && discoveredProfiles.length > 0 && <div className="inbox-discovered"><p className="eyebrow">People you can message</p>{discoveredProfiles.map((profile) => <button className="inbox-discovered-row" type="button" key={profile.username} onClick={() => openProfile(profile)}><img src={profile.image} alt="" /><span><strong>{profile.name}</strong><small>{profile.role}</small></span><Icon name="chevron-right" size={17} /></button>)}</div>}
      <div className="inbox-list">{visibleItems.map((item) => <button className={`inbox-row ${selectedProfile?.username === item.username ? 'selected' : ''}`} type="button" key={item.username} onClick={() => openProfile(item)}>
        <span className="inbox-avatar-wrap"><img src={resolveMediaUrl(item.avatar) || '/Logo_main.png'} alt="" onError={(event) => { event.currentTarget.src = '/Logo_main.png' }} /><i className="inbox-online-dot" /></span><span className="inbox-copy"><strong>{item.name}</strong><p>{item.last_message || item.bio}</p><small className="inbox-skills">{item.skills.slice(0, 3).join(' / ') || 'Skillverse member'}</small></span>
        <span className="inbox-actions">{item.unread_count > 0 && <b>{item.unread_count}</b>}<Icon name="chevron-right" size={17} /></span>
      </button>)}</div>
    </div>
    <div className="inbox-chat-pane">{selectedProfile ? <ChatWorkspace profile={selectedProfile} currentUsername={currentUsername} onExperienceAwarded={onExperienceAwarded} /> : <div className="inbox-chat-placeholder"><h2>Select a chat to start messaging</h2><p>Your latest conversation will appear here.</p></div>}</div>
  </section>
}

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (name === 'search') return <svg {...common}><circle cx="10.8" cy="10.8" r="5.8" /><path d="m16 16 4 4" /></svg>
  if (name === 'bell') return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>
  if (name === 'chevron-left') return <svg {...common}><path d="m14.5 5-7 7 7 7" /></svg>
  if (name === 'chevron-right') return <svg {...common}><path d="m9.5 5 7 7-7 7" /></svg>
  if (name === 'send') return <svg {...common}><path d="m3 11 18-8-8 18-2.5-7.5L3 11Z" /><path d="m10.5 13.5 4-4" /></svg>
  if (name === 'meet') return <svg {...common}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h7A2.5 2.5 0 0 1 16 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 4 16.5v-9Z" /><path d="m16 10 4-2.5v9L16 14" /><path d="M7 9h4M7 12h3" /></svg>
  if (name === 'moon') return <svg {...common}><path d="M20.5 14.7A8.5 8.5 0 0 1 9.3 3.5 8.5 8.5 0 1 0 20.5 14.7Z" /></svg>
  if (name === 'sun') return <svg {...common}><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></svg>
  return <svg {...common}><path d="M12 3v18M3 12h18" /></svg>
}

function AboutSection() {
  const [activeStep, setActiveStep] = useState(0)
  const steps = [
    { title: 'Find a spark', text: 'Search people by the skills you want to learn, from coding and maths to cooking and design.', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85', alt: 'People learning together around a laptop' },
    { title: 'Start a real conversation', text: 'Open a chat, ask questions, share context, and learn directly from someone who has done it.', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85', alt: 'A workspace where someone is learning to code' },
    { title: 'Swap what you know', text: 'Teach a skill in return, mark the exchange, and build a learning circle that keeps growing.', image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=85', alt: 'People collaborating in a shared studio' },
  ]

  return <section id="about" className="about-section">
    <div className="about-intro about-reveal">
      <p className="eyebrow">Why Skillverse</p>
      <h2>Learning should feel open, human, and within everyone&apos;s reach.</h2>
      <p>At skillverse, we believe that skills shouldn&apos;t be locked behind expensive certifications, long waiting lists, or rigid classrooms. Anyone who knows something valuable should be able to teach it, and anyone curious enough to learn should be able to access it — simply and without barriers. In a world where knowledge is often gatekept by degrees and price tags, we wanted to build something different: a place where learning feels open, human, and within everyone&apos;s reach.</p>
    </div>
    <div className="story-block about-reveal">
      <div><p className="eyebrow">Our Story</p><h2>Built by students who wanted a wider classroom.</h2><p>We&apos;re two students who noticed a gap in the way learning works today. Schools teach us theory, but real-world skills — photography, coding, cooking, public speaking, design, and dozens of others — often go untaught. So we built skillverse, a space where people can teach and learn from each other directly, at their own pace, in their own way, without the usual barriers of cost or access.</p></div>
      <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1100&q=85" alt="Students collaborating around a shared project" />
    </div>
    <div className="how-section about-reveal">
      <div className="how-heading"><p className="eyebrow">How Skillverse works</p><h2>One useful conversation at a time.</h2></div>
      <div className="how-layout">
        <div className="how-steps">{steps.map((step, index) => <button className={`how-step ${activeStep === index ? 'active' : ''}`} type="button" key={step.title} onClick={() => setActiveStep(index)}><span>0{index + 1}</span><strong>{step.title}</strong><small>{activeStep === index ? step.text : 'Explore this step'}</small></button>)}</div>
        <div className="how-image-wrap"><img src={steps[activeStep].image} alt={steps[activeStep].alt} key={steps[activeStep].title} /><div className="how-image-caption"><span>Step 0{activeStep + 1}</span><strong>{steps[activeStep].title}</strong></div></div>
      </div>
    </div>
  </section>
}

const quizQuestionBank = {
  python: [
    ['Which keyword defines a function in Python?', ['func', 'def', 'function', 'define'], 1],
    ['Which type stores an ordered, changeable collection?', ['tuple', 'set', 'list', 'string'], 2],
    ['What does len() return?', ['The last item', 'The number of items', 'A sorted list', 'A boolean'], 1],
    ['Which symbol starts a comment in Python?', ['//', '#', '--', '/*'], 1],
    ['What is the result of 3 * 2?', ['5', '6', '8', '9'], 1],
    ['Which value represents no value in Python?', ['empty', 'null', 'None', 'void'], 2],
    ['Which loop iterates over items in a sequence?', ['for', 'repeat', 'each', 'loop'], 0],
    ['What file extension is commonly used for Python files?', ['.py', '.python', '.pt', '.p'], 0],
    ['Which structure stores key-value pairs?', ['list', 'dictionary', 'tuple', 'array'], 1],
    ['What does bool(0) return?', ['True', 'False', '0', 'None'], 1],
  ],
  javascript: [
    ['Which keyword declares a block-scoped variable?', ['var', 'let', 'define', 'fixed'], 1],
    ['Which method converts JSON text into an object?', ['JSON.parse', 'JSON.read', 'JSON.object', 'JSON.decode'], 0],
    ['What does === compare?', ['Only types', 'Only values', 'Values and types', 'Object keys'], 2],
    ['Which array method creates a new transformed array?', ['map', 'push', 'sort', 'join'], 0],
    ['Which keyword defines a constant binding?', ['constant', 'fixed', 'const', 'final'], 2],
    ['What does typeof return?', ['A value', 'A type string', 'An object copy', 'A boolean only'], 1],
    ['Which symbol starts a single-line comment?', ['#', '//', '<!--', '--'], 1],
    ['What is the first index of an array?', ['0', '1', '-1', 'first'], 0],
    ['Which API selects the first matching element?', ['document.find', 'document.querySelector', 'document.getFirst', 'document.select'], 1],
    ['Which value means an intentional absence of object value?', ['undefined', 'empty', 'null', 'void'], 2],
  ],
  general: [
    ['What is the main purpose of practice?', ['To avoid learning', 'To improve a skill', 'To remove feedback', 'To skip basics'], 1],
    ['Which habit supports learning?', ['Regular review', 'Never asking questions', 'Avoiding examples', 'Ignoring feedback'], 0],
    ['What is a useful first step when learning?', ['Set a clear goal', 'Skip fundamentals', 'Avoid practice', 'Memorize everything'], 0],
    ['Why are examples useful?', ['They provide context', 'They hide mistakes', 'They replace practice', 'They remove questions'], 0],
    ['What does feedback help you do?', ['Find areas to improve', 'Stop learning', 'Avoid experiments', 'Forget goals'], 0],
    ['Which approach helps solve a difficult task?', ['Break it into smaller steps', 'Give up immediately', 'Avoid testing', 'Change the goal constantly'], 0],
    ['What makes a question useful?', ['It is specific', 'It has no context', 'It avoids the topic', 'It cannot be answered'], 0],
    ['Why share knowledge?', ['It helps others and reinforces your understanding', 'It prevents collaboration', 'It removes practice', 'It hides useful ideas'], 0],
    ['What is a skill exchange?', ['Two people share what they know', 'One person never participates', 'A test without feedback', 'A list of unrelated topics'], 0],
    ['What should you do after making a mistake?', ['Review it and try again', 'Hide it', 'Stop practicing', 'Ignore all feedback'], 0],
  ],
}

function QuizPage({ profile, onBack, onExperienceAwarded }) {
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const skillKey = profile.skills.map((skill) => normalize(skill)).find((skill) => quizQuestionBank[skill.split(' ')[0]])
  const questionSet = quizQuestionBank[skillKey?.split(' ')[0]] || quizQuestionBank.general
  const questions = questionSet.slice(0, 10)

  const submitQuiz = async (event) => {
    event.preventDefault()
    const correctAnswers = questions.reduce((total, question, index) => total + (answers[index] === question[2] ? 1 : 0), 0)
    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/quiz/xp/`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ correct_answers: correctAnswers }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Unable to submit the quiz.')
      setResult({ correctAnswers, pointsAwarded: data.points_awarded, experience: data.experience })
      onExperienceAwarded(data.experience)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return <main className="quiz-page"><div className="quiz-shell"><button className="quiz-back" type="button" onClick={onBack}>Back to home</button><p className="eyebrow">Skill check</p><h1>Quiz your skills</h1><p className="quiz-intro">Answer 10 questions based on your profile skills. Each correct answer adds 5 XP to your wallet.</p><form onSubmit={submitQuiz}><div className="quiz-list">{questions.map((question, index) => <fieldset className={`quiz-question ${result ? (answers[index] === question[2] ? 'quiz-correct' : 'quiz-wrong') : ''}`} key={question[0]}><legend>{index + 1}. {question[0]}</legend>{question[1].map((option, optionIndex) => <label key={option}><input type="radio" name={`question-${index}`} checked={answers[index] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))} disabled={Boolean(result)} />{option}</label>)}{result && <small>{answers[index] === question[2] ? 'Correct' : `Correct answer: ${question[1][question[2]]}`}</small>}</fieldset>)}</div>{result?.error && <p className="quiz-error" role="alert">{result.error}</p>}{result && !result.error && <div className="quiz-result"><strong>{result.correctAnswers}/10 correct</strong><span>+{result.pointsAwarded} XP awarded. Total XP: {result.experience}</span></div>}<button className="quiz-submit" type="submit" disabled={isSubmitting || Boolean(result)}>{isSubmitting ? 'Checking...' : 'Submit quiz'}</button></form></div></main>
}

function HomePage({ avatarUrl, username, profiles, currentProfile, onProfileUpdate, onExperienceAwarded }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [searchAccent, setSearchAccent] = useState(searchAccents[0])
  const [suggestionIndex, setSuggestionIndex] = useState(-1)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showInbox, setShowInbox] = useState(false)
  const [openProfile, setOpenProfile] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const searchBoxRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return undefined
    const refreshPresence = () => fetch(`${API_BASE}/me/`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined)
    refreshPresence()
    const heartbeat = window.setInterval(refreshPresence, 30000)
    return () => window.clearInterval(heartbeat)
  }, [])

  const suggestions = useMemo(() => {
    const searchTerm = normalize(query)
    if (!searchTerm) return []
    const options = [...new Set(profiles.flatMap((profile) => [...profile.skills, profile.name, profile.role]))]
    return options.filter((option) => normalize(option).includes(searchTerm)).slice(0, 6)
  }, [profiles, query])

  const submitSearch = (value = query) => {
    if (!value.trim()) return
    setQuery(value.trim())
    setSubmittedQuery(value.trim())
    setShowInbox(false)
    setOpenProfile(null)
    setIsChatOpen(false)
    const randomValue = new Uint32Array(1)
    window.crypto.getRandomValues(randomValue)
    let nextAccent = searchAccents[randomValue[0] % searchAccents.length]
    if (nextAccent === searchAccent) nextAccent = searchAccents[(searchAccents.indexOf(nextAccent) + 1) % searchAccents.length]
    setSearchAccent(nextAccent)
    setSuggestionIndex(-1)
    setIsSearchOpen(false)
  }

  const handleSearchKeyDown = (event) => {
    if (!suggestions.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSuggestionIndex((current) => (current + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSuggestionIndex((current) => (current - 1 + suggestions.length) % suggestions.length)
    } else if (event.key === 'Enter' && suggestionIndex >= 0) {
      event.preventDefault()
      submitSearch(suggestions[suggestionIndex])
    } else if (event.key === 'Escape') {
      setSuggestionIndex(-1)
      setIsSearchOpen(false)
    }
  }

  useEffect(() => {
    const closeSearchSuggestions = (event) => {
      if (!searchBoxRef.current?.contains(event.target)) setIsSearchOpen(false)
    }
    document.addEventListener('pointerdown', closeSearchSuggestions)
    return () => document.removeEventListener('pointerdown', closeSearchSuggestions)
  }, [])

  const returnHome = (event) => {
    event?.preventDefault()
    setActiveIndex(0)
    setSubmittedQuery('')
    setQuery('')
    setIsSearchOpen(false)
    setIsChatOpen(false)
    setShowInbox(false)
    setOpenProfile(null)
  }

  const selectSlide = (index) => {
    setActiveIndex((index + slides.length) % slides.length)
  }

  useEffect(() => {
    if (isPaused) return undefined
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 5200)
    return () => window.clearInterval(interval)
  }, [isPaused])

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'ArrowLeft') selectSlide(activeIndex - 1)
      if (event.key === 'ArrowRight') selectSlide(activeIndex + 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeIndex])

  return (
    <main className="site-shell">
      <nav className="top-nav" aria-label="Primary navigation">
        <a className="brand" href="#home" aria-label="Skillverse home">
          <img src="/Logo_main.png" alt="" className="brand-logo" />
          <span>skillverse<span className="brand-dot">.</span></span>
        </a>

        <div className="nav-links">
          <a className={submittedQuery ? '' : 'active'} href="#home" onClick={returnHome}>Home</a>
          <a href="#about">About us</a>
          <a href="#quiz" onClick={(event) => { event.preventDefault(); setShowQuiz(true); setShowInbox(false); setSubmittedQuery(''); setIsChatOpen(false) }}>Quiz</a><a href="#chats" onClick={(event) => { event.preventDefault(); setShowInbox(true); setSubmittedQuery(''); setIsChatOpen(false) }}>Chats{unreadCount > 0 && <span className="nav-unread-dot" aria-label={`${unreadCount} unread messages`} />}</a>
        </div>

        <form ref={searchBoxRef} className="search-box" onSubmit={(event) => { event.preventDefault(); submitSearch() }}>
          <Icon name="search" size={15} />
          <div className="search-input-wrap">
            <input type="search" value={query} onFocus={() => setIsSearchOpen(true)} onChange={(event) => { setQuery(event.target.value); setSuggestionIndex(-1); setIsSearchOpen(true) }} onKeyDown={handleSearchKeyDown} placeholder="Search a skill or person" aria-label="Search skills" aria-autocomplete="list" aria-controls="search-suggestions" aria-activedescendant={suggestionIndex >= 0 ? `suggestion-${suggestionIndex}` : undefined} />
            {isSearchOpen && suggestions.length > 0 && <div id="search-suggestions" className="search-suggestions" role="listbox">{suggestions.map((suggestion, index) => <button id={`suggestion-${index}`} className={index === suggestionIndex ? 'selected' : ''} type="button" role="option" aria-selected={index === suggestionIndex} key={suggestion} onMouseDown={(event) => event.preventDefault()} onClick={() => submitSearch(suggestion)}><Icon name="search" size={12} />{suggestion}</button>)}</div>}
          </div>
        </form>

        <div className="nav-actions">
          <button className="profile-button" type="button" onClick={() => setIsProfileOpen(true)} aria-label="Open your profile">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Your profile" className="profile-avatar profile-image" onError={(event) => { event.currentTarget.src = '/Logo_main.png' }} />
            ) : (
              <span className="profile-avatar" aria-hidden="true">
                <span className="avatar-head" />
                <span className="avatar-body" />
              </span>
            )}
          </button>
          <span className="nav-profile-name" title={username}>{username}</span>
          <span className="experience-badge" title="Experience points"><strong>{currentProfile?.experience || 0}</strong><small>XP</small></span>
        </div>
      </nav>

      {showQuiz ? <QuizPage profile={currentProfile || { skills: [] }} onBack={() => setShowQuiz(false)} onExperienceAwarded={onExperienceAwarded} /> : showInbox ? <Inbox currentUsername={username} profiles={profiles} initialProfile={openProfile} onUnreadChange={setUnreadCount} onExperienceAwarded={onExperienceAwarded} /> : submittedQuery ? <SearchResults profiles={profiles} key={openProfile?.username || submittedQuery} query={submittedQuery} accent={searchAccent} onClear={returnHome} onOpenChat={(profile) => { setOpenProfile(profile); setShowInbox(true); setSubmittedQuery(''); setIsChatOpen(true) }} /> : <section
        className="slider-shell"
        aria-roledescription="carousel"
        aria-label="Featured skills"
        onPointerDown={(event) => {
          if (event.target.closest('button')) return
          event.currentTarget.setPointerCapture(event.pointerId)
          setIsPaused(true)
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
          setIsPaused(false)
        }}
        onPointerCancel={() => setIsPaused(false)}
      >
        <div className="slides-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {slides.map((slide, index) => (
            <article
              className={`skill-slide ${slide.className} ${slide.summary ? 'summary-slide' : ''}`}
              key={slide.title.join('-')}
              aria-hidden={index !== activeIndex}
            >
              {slide.image && <div className="slide-image-wrap" aria-hidden="true"><img src={slide.image} alt="" className="slide-image" /></div>}
              {slide.summary && <><div className="orb orb-one" aria-hidden="true" /><div className="orb orb-two" aria-hidden="true" /></>}
              <div className="slide-copy">
                <h1>
                  {slide.title.map((line, lineIndex) => (
                    <span key={`${line}-${lineIndex}`} className={`title-line title-line-${lineIndex + 1}`}>
                      {line}
                    </span>
                  ))}
                </h1>
                <p className="slide-description">{slide.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="slider-controls">
          <div className="slider-dots" role="tablist" aria-label="Choose a featured skill">
            {slides.map((slide, index) => (
              <button
                className={`slider-dot ${index === activeIndex ? 'selected' : ''}`}
                type="button"
                key={slide.title.join('-')}
                onClick={() => selectSlide(index)}
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Show ${slide.title.join(' ')}`}
              />
            ))}
          </div>
          <div className="arrow-controls">
            <button type="button" onClick={() => selectSlide(activeIndex - 1)} aria-label="Previous slide"><Icon name="chevron-left" /></button>
            <button type="button" onClick={() => selectSlide(activeIndex + 1)} aria-label="Next slide"><Icon name="chevron-right" /></button>
          </div>
        </div>
      </section>}

      {!showInbox && !isChatOpen && <AboutSection />}
      {!showInbox && !isChatOpen && <PageFooter />}
      {isProfileOpen && currentProfile && <ProfileModal profile={currentProfile} onClose={() => setIsProfileOpen(false)} onSaved={onProfileUpdate} />}
    </main>
  )
}

function App() {
  const [showHome, setShowHome] = useState(false)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [username, setUsername] = useState('')
  const [currentProfile, setCurrentProfile] = useState(null)
  const [profiles, setProfiles] = useState([])

  const loadAuthenticatedProfiles = async (token) => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    const [profileResponse, profilesResponse] = await Promise.all([
      fetch(`${API_BASE}/me/`, { headers }),
      fetch(`${API_BASE}/profiles/`, { headers }),
    ])
    if (!profileResponse.ok) return
    const profile = await profileResponse.json()
    setCurrentProfile(profileFromApi(profile))
    setAvatarUrl(resolveMediaUrl(profile.avatar))
    setUsername(profile.username)
    if (profilesResponse.ok) {
      const items = await profilesResponse.json()
      setProfiles(items.map(profileFromApi))
    }
  }
  if (showCreateAccount) {
    return <CreateAccountPage onContinue={({ avatarUrl: createdAvatarUrl }) => {
      setAvatarUrl(createdAvatarUrl)
      loadAuthenticatedProfiles(localStorage.getItem('access_token'))
      setShowCreateAccount(false)
      setShowHome(true)
    }} />
  }

  if (showLogin) {
    return <LoginPage onContinue={({ avatarUrl: loggedInAvatarUrl, username: loggedInUsername }) => {
      setAvatarUrl(loggedInAvatarUrl)
      setUsername(loggedInUsername)
      const token = localStorage.getItem('access_token')
      loadAuthenticatedProfiles(token)
      setShowLogin(false)
      setShowHome(true)
    }} onCreateAccount={() => {
      setShowLogin(false)
      setShowCreateAccount(true)
    }} />
  }

  if (!showHome) {
    return <SignupCreatePage onContinue={() => setShowLogin(true)} onCreateAccount={() => setShowCreateAccount(true)} />
  }

  return <HomePage avatarUrl={currentProfile?.image || avatarUrl} username={username} profiles={profiles} currentProfile={currentProfile} onProfileUpdate={(profile) => { setCurrentProfile(profile); setAvatarUrl(profile.image || '') }} onExperienceAwarded={(experience) => setCurrentProfile((current) => ({ ...current, experience }))} />
}

export default App
