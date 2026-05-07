// src/pages/auth/ResetPasswordPage.tsx
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { authApi } from '../../lib/api'
import { cn } from '../../lib/utils'

const schema = z.object({
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/(?=.*[A-Z])/, 'One uppercase required')
    .regex(/(?=.*[0-9])/, 'One number required'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await authApi.resetPassword(token!, data)
      setSuccess(true)
      setTimeout(() => navigate('/auth/login'), 3000)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Reset failed. The link may have expired.')
    }
  }

  if (success) {
    return (
      <div className="text-center animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-accent-green/15 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-accent-green" size={32} />
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Password Reset!</h2>
        <p className="text-surface-400 text-sm mb-6">
          Your password has been updated. Redirecting to login...
        </p>
        <Link to="/auth/login" className="brand-btn inline-block">Go to Login</Link>
      </div>
    )
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h2 className="text-white text-2xl font-bold">Set new password</h2>
        <p className="text-surface-400 text-sm mt-1">Choose a strong password for your account</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-surface-300 text-sm font-medium mb-1.5">New Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={cn('input-field pr-11', errors.password && 'border-accent-rose/50')}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white">
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-accent-rose text-xs">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-surface-300 text-sm font-medium mb-1.5">Confirm Password</label>
          <input
            {...register('confirmPassword')}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className={cn('input-field', errors.confirmPassword && 'border-accent-rose/50')}
          />
          {errors.confirmPassword && <p className="mt-1 text-accent-rose text-xs">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="brand-btn w-full flex items-center justify-center gap-2">
          {isSubmitting ? <><Loader2 size={17} className="animate-spin" /> Resetting...</> : 'Reset Password'}
        </button>
      </form>
    </div>
  )
}
