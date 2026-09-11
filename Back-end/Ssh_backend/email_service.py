import random
import resend

def Email_verifiation(email: str, username: str):
    verification_code = ''.join(str(random.randint(0, 9)) for _ in range(4))
    #resend.api_key = #"re_9AyVqDxA_HKE2KTQs36ewoz1UZVfWMH8s"
    if not resend.api_key:
        raise RuntimeError('Verification email is not configured. Set RESEND_API_KEY on the backend.')

    try:
        resend.Emails.send({
            'from': 'onboarding@resend.dev',
            'to': email,
            'subject': 'Skillverse verification code',
            'html': f'<p>Hi {username},</p><p>Your Skillverse verification code is:</p><p><strong>{verification_code}</strong></p><p>This email, onboarding@resend.dev is only for testing.</p>',
        })
        return verification_code
    except Exception as exc:
        raise RuntimeError(f'Verification email delivery failed. Check the Resend API key, sender verification, and recipient address: {exc}') from exc


