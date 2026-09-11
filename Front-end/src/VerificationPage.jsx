import { useState } from 'react'
import './VerificationPage.css'

const API_BASE = 'http://127.0.0.1:8000/api/accounts'

function VerificationPage({ identifier, email, onBack, onVerified }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const verify = async (event) => {
    event.preventDefault()
    if (!/^\d{4}$/.test(code)) {
      setError('Enter the four-digit code from your email.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Unable to verify this code.')
        if (!response.ok) throw new Error(data.detail || 'The verification code is incorrect.')
      onVerified(data)
    } catch (verifyError) {
      setError(verifyError.message)
      setIsSubmitting(false)
    }
  }

  const resend = async () => {
    setIsResending(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`${API_BASE}/verify/resend/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Unable to resend the code.')
      setNotice('A new code has been sent.')
      setCode('')
    } catch (resendError) {
      setError(resendError.message)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <main className="verification-shell">
      <section className="verification-card" aria-labelledby="verification-title">
        <button className="verification-back" type="button" onClick={onBack} aria-label="Go back" title="Go back">←</button>
        <div className="verification-heading">
          <h1 id="verification-title">Verify your email</h1>
          <p>Enter the four-digit code sent to <strong>{email}</strong>.</p>
        </div>
        <form className="verification-form" onSubmit={verify}>
          <label className="verification-field"><span>Verification code</span><input value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }} inputMode="numeric" autoComplete="one-time-code" placeholder="0000" autoFocus /></label>
          {error && <p className="verification-error" role="alert">{error}</p>}
          {notice && <p className="verification-notice" role="status">{notice}</p>}
          <button className="verification-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Verifying...' : 'Verify'}</button>
        </form>
        <button className="verification-resend" type="button" onClick={resend} disabled={isResending}>{isResending ? 'Sending...' : 'Resend code'}</button>
      </section>
    </main>
  )
}

export default VerificationPage
