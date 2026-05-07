// src/pages/auth/RegisterPage.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { authApi } from '../../lib/api'
import { cn } from '../../lib/utils'

const schema = z.object({
  firstName: z.string().min(2, 'At least 2 characters'),
  lastName: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
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

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await authApi.register(data)
      setSuccess(true)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed')
    }
  }

  if (success) {
    return (
      <div className="text-center animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-accent-green/15 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-accent-green" size={32} />
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Account Created!</h2>
        <p className="text-surface-400 text-sm mb-6">
          We've sent a verification link to your email. Please verify to activate your account.
        </p>
        <button onClick={() => navigate('/auth/login')} className="brand-btn">
          Go to Login
        </button>
      </div>
    )
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h2 className="text-white text-2xl font-bold">Create account</h2>
        <p className="text-surface-400 text-sm mt-1">Join Adullam Bank — takes 2 minutes</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-surface-300 text-sm font-medium mb-1.5">First name</label>
            <input {...register('firstName')} placeholder="Jean" className={cn('input-field', errors.firstName && 'border-accent-rose/50')} />
            {errors.firstName && <p className="mt-1 text-accent-rose text-xs">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-surface-300 text-sm font-medium mb-1.5">Last name</label>
            <input {...register('lastName')} placeholder="Dupont" className={cn('input-field', errors.lastName && 'border-accent-rose/50')} />
            {errors.lastName && <p className="mt-1 text-accent-rose text-xs">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-surface-300 text-sm font-medium mb-1.5">Email</label>
          <input {...register('email')} type="email" placeholder="you@example.com" className={cn('input-field', errors.email && 'border-accent-rose/50')} />
          {errors.email && <p className="mt-1 text-accent-rose text-xs">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-surface-300 text-sm font-medium mb-1.5">Phone (optional)</label>
          <input {...register('phone')} type="tel" placeholder="+225 00 00 00 00" className="input-field" />
        </div>

        <div>
          <label className="block text-surface-300 text-sm font-medium mb-1.5">Password</label>
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
          <label className="block text-surface-300 text-sm font-medium mb-1.5">Confirm password</label>
          <input
            {...register('confirmPassword')}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className={cn('input-field', errors.confirmPassword && 'border-accent-rose/50')}
          />
          {errors.confirmPassword && <p className="mt-1 text-accent-rose text-xs">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="brand-btn w-full flex items-center justify-center gap-2">
          {isSubmitting ? <><Loader2 size={17} className="animate-spin" /> Creating account...</> : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-surface-400 text-sm mt-6">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Sign in</Link>
      </p>
    </div>
  )
}
