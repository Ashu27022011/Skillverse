import { useState } from 'react'
import './LoginPage.css'

const API_BASE = 'http://127.0.0.1:8000/api/accounts'
const resolveAvatarUrl = (value) => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return new URL(value, `${API_BASE}/`).toString()
}

function LoginPage({ onContinue, onCreateAccount }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setError('Username, email and password are required.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username.trim(), email: form.email.trim(), password: form.password }),
      })
      const data = await response.json().catch(() => ({}))
      const validationMessage = data?.detail || data?.email?.[0] || data?.username?.[0] || data?.password?.[0] || data?.non_field_errors?.[0]
      if (!response.ok) throw new Error(validationMessage || 'Incorrect username, email or password.')

      localStorage.setItem('access_token', data.tokens.access)
      localStorage.setItem('refresh_token', data.tokens.refresh)
      onContinue({ avatarUrl: resolveAvatarUrl(data.profile?.avatar), username: data.profile?.username })
    } catch (submitError) {
      setError(submitError.message || 'Unable to log in right now.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <div className="login-brandmark"><img src="/logo.png" alt="Skillverse logo" /></div>
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-heading">
            
          <h1 id="login-title">Log in</h1>
          <p>Return to your learning circle.</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="login-field"><span>Username</span><input type="text" name="username" value={form.username} onChange={handleChange} placeholder="Enter your username" autoComplete="username" /></label>
          <label className="login-field"><span>Email</span><input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email address" autoComplete="email" /></label>
          <label className="login-field"><span>Password</span><div className="login-password"><input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Enter your password" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Checking...' : 'Proceed'}</button>
        </form>
        <div className="login-links"><button type="button" onClick={onCreateAccount}>Don't have an account?</button><a href="https://support.google.com/accounts/answer/41078?hl=en&co=GENIE.Platform%3DDesktop" target="_blank" rel="noreferrer">Forgot your password? Reset it.</a></div>
      </section>
    </main>
  )
}

export default LoginPage
