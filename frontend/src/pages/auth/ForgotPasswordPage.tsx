// src/pages/auth/ForgotPasswordPage.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail } from 'lucide-react'
import { authApi } from '../../lib/api'

const schema = z.object({ email: z.string().email('Invalid email') })
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  if (sent) {
    return (
      <div className="text-center animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-brand-500/15 flex items-center justify-center mx-auto mb-4">
          <Mail className="text-brand-400" size={28} />
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Check your inbox</h2>
        <p className="text-surface-400 text-sm mb-6">
          If this email is registered, you'll receive a reset link shortly. Valid for 15 minutes.
        </p>
        <Link to="/auth/login" className="brand-btn inline-block">Back to Login</Link>
      </div>
    )
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h2 className="text-white text-2xl font-bold">Forgot password?</h2>
        <p className="text-surface-400 text-sm mt-1">Enter your email and we'll send a reset link</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-surface-300 text-sm font-medium mb-1.5">Email</label>
          <input {...register('email')} type="email" placeholder="you@example.com" className="input-field" />
          {errors.email && <p className="mt-1 text-accent-rose text-xs">{errors.email.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="brand-btn w-full flex items-center justify-center gap-2">
          {isSubmitting ? <><Loader2 size={17} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
        </button>
      </form>

      <p className="text-center text-surface-400 text-sm mt-6">
        <Link to="/auth/login" className="text-brand-400 hover:text-brand-300 transition-colors">← Back to login</Link>
      </p>
    </div>
  )
}

export default ForgotPasswordPage
