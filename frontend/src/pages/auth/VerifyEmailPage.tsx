// src/pages/auth/VerifyEmailPage.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { authApi } from '../../lib/api'

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid link'); return }
    authApi.verifyEmail(token)
      .then((res) => { setStatus('success'); setMessage(res.data.message) })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.response?.data?.message || 'Verification failed')
      })
  }, [token])

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
      <div className="text-center max-w-sm animate-slide-up">
        {status === 'loading' && (
          <>
            <Loader2 className="text-brand-400 animate-spin mx-auto mb-4" size={40} />
            <h2 className="text-white text-xl font-bold">Verifying your email...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-accent-green/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-accent-green" size={32} />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Email Verified!</h2>
            <p className="text-surface-400 text-sm mb-6">{message}</p>
            <Link to="/auth/login" className="brand-btn inline-block">Sign In Now</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-accent-rose/15 flex items-center justify-center mx-auto mb-4">
              <XCircle className="text-accent-rose" size={32} />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Verification Failed</h2>
            <p className="text-surface-400 text-sm mb-6">{message}</p>
            <Link to="/auth/login" className="brand-btn inline-block">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  )
}
