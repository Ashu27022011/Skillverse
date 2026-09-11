import { useMemo, useRef, useState } from 'react'
import './create_account.css'

const API_BASE = 'http://127.0.0.1:8000/api/accounts'

function CreateAccountPage({ onContinue }) {
  const fileInputRef = useRef(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    bio: '',
    avatar: null,
    avatarPreview: '',
    skillInput: '',
    skills: [],
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const remainingBio = useMemo(() => 500 - form.bio.length, [form.bio.length])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const handleAvatarSelect = (event) => {
    const selectedFile = event.target.files?.[0] || null
    if (!selectedFile) return

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(selectedFile.type)) {
      setError('Please upload a PNG, JPG, JPEG or WEBP image.')
      return
    }

    setForm((current) => ({
      ...current,
      avatar: selectedFile,
      avatarPreview: URL.createObjectURL(selectedFile),
    }))
    setError('')
  }

  const addSkill = () => {
    const trimmed = form.skillInput.trim()
    if (!trimmed) return
    if (form.skills.includes(trimmed)) {
      setForm((current) => ({ ...current, skillInput: '' }))
      return
    }
    setForm((current) => ({
      ...current,
      skills: [...current.skills, trimmed],
      skillInput: '',
    }))
    setError('')
  }

  const handleSkillKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addSkill()
    }
  }

  const removeSkill = (skillToRemove) => {
    setForm((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill !== skillToRemove),
    }))
  }

  const validateStepOne = () => {
    if (!form.username.trim()) return 'Username is required.'
    if (!form.email.trim()) return 'Email is required.'
    if (!form.password.trim()) return 'Password is required.'
    return ''
  }

  const handleProceed = async (event) => {
    event.preventDefault()
    const validationError = validateStepOne()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsCheckingUsername(true)
    setError('')

    try {
      const response = await fetch(
        `${API_BASE}/username-availability/?username=${encodeURIComponent(form.username.trim())}`,
      )
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.available) {
        throw new Error(data.detail || 'A user with that username already exists.')
      }

      setStep(2)
    } catch (checkError) {
      setError(checkError.message || 'Unable to check username right now.')
    } finally {
      setIsCheckingUsername(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationError = validateStepOne()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!form.bio.trim()) {
      setError('Please add a short description for your profile.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const payload = new FormData()
      payload.append('username', form.username.trim())
      payload.append('email', form.email.trim())
      payload.append('password', form.password)
      payload.append('bio', form.bio.trim())
      if (form.avatar) payload.append('avatar', form.avatar)
      form.skills.forEach((skill) => payload.append('skills', skill))

      const response = await fetch(`${API_BASE}/register/`, {
        method: 'POST',
        body: payload,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const detail = data?.detail || data?.email?.[0] || data?.username?.[0] || 'Unable to create account right now.'
        throw new Error(detail)
      }

      localStorage.setItem('access_token', data.tokens.access)
      localStorage.setItem('refresh_token', data.tokens.refresh)
      const avatarUrl = data.profile?.avatar ? new URL(data.profile.avatar, API_BASE).toString() : ''
      onContinue({ avatarUrl })
    } catch (submitError) {
      setError(submitError.message || 'Something went wrong while creating your account.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="create-account-shell">
      <section className="create-account-card" aria-labelledby="register-title">
        <div className="card-header">
          {step === 2 && (
            <button
              type="button"
              className="back-button"
              onClick={() => {
                setStep(1)
                setError('')
              }}
              aria-label="Back to account details"
              title="Back to account details"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          <h1 id="register-title">Register</h1>
          
        </div>

        {step === 1 ? (
          <form className="create-form" onSubmit={handleProceed} noValidate>
            <label className="field-group">
              <span>Username*</span>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleInputChange}
                placeholder="Enter your name"
              />
            </label>

            <label className="field-group">
              <span>Email*</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
              />
            </label>

            <label className="field-group">
              <span>Password*</span>
              <div className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
                      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.4 4.2 9.5 6.2a1.5 1.5 0 0 1 0 1.6 16 16 0 0 1-3 3.7" />
                      <path d="M6.2 6.2A16 16 0 0 0 2.5 11.2a1.5 1.5 0 0 0 0 1.6C3.6 14.8 6.8 19 12 19c1 0 1.9-.2 2.7-.5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="primary-submit" disabled={isCheckingUsername}>
              {isCheckingUsername ? 'Checking...' : 'Proceed'}
            </button>
          </form>
        ) : (
          <form className="create-form profile-form" onSubmit={handleSubmit} noValidate>
            <div className="profile-upload-wrap">
              <button
                type="button"
                className={`profile-upload ${form.avatarPreview ? 'has-preview' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload profile image"
              >
                {form.avatarPreview ? (
                  <img src={form.avatarPreview} alt="Profile upload preview" className="profile-preview" />
                ) : (
                  <>
                    <svg className="upload-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="8" r="3.4" />
                      <path d="M5 20c.8-3.5 3.2-5.5 7-5.5s6.2 2 7 5.5" />
                    </svg>
                    <span className="upload-text">Upload Profile Image</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                hidden
                onChange={handleAvatarSelect}
              />
            </div>

            <label className="field-group bio-field">
              <span>Description</span>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleInputChange}
                maxLength={500}
                placeholder="Tell people a little about yourself..."
              />
              <small>{remainingBio} characters left</small>
            </label>

            <div className="skills-field">
              <label className="field-group inline-skill-input">
                <span>Skills</span>
                <div className="skill-input-row">
                  <input
                    type="text"
                    name="skillInput"
                    value={form.skillInput}
                    onChange={handleInputChange}
                    onKeyDown={handleSkillKeyDown}
                    placeholder="Add a skill"
                  />
                  <button type="button" className="skill-add-button" onClick={addSkill}>Add</button>
                </div>
              </label>

              <div className="skill-list-wrap">
                {form.skills.length > 0 ? (
                  <ul className="skill-list">
                    {form.skills.map((skill) => (
                      <li key={skill}>
                        <span>{skill}</span>
                        <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="skill-empty">No skills added yet</div>
                )}
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="primary-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

export default CreateAccountPage
