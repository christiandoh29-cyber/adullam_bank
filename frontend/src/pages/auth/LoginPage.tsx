// src/pages/auth/LoginPage.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import { cn } from '../../lib/utils'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { setUser } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const res = await authApi.login(data)
      setUser(res.data.user)
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed'
      setError(msg)
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h2 className="text-white text-2xl font-bold">Welcome back</h2>
        <p className="text-surface-400 text-sm mt-1">Sign in to your Adullam Bank account</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-surface-300 text-sm font-medium mb-1.5">Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@example.com"
            className={cn('input-field', errors.email && 'border-accent-rose/50 focus:ring-accent-rose/30')}
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-accent-rose text-xs">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-surface-300 text-sm font-medium mb-1.5">Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={cn('input-field pr-11', errors.password && 'border-accent-rose/50')}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-accent-rose text-xs">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-end">
          <Link to="/auth/forgot-password" className="text-brand-400 hover:text-brand-300 text-sm transition-colors">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={isSubmitting} className="brand-btn w-full flex items-center justify-center gap-2">
          {isSubmitting ? <><Loader2 size={17} className="animate-spin" /> Signing in...</> : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-surface-400 text-sm mt-6">
        Don't have an account?{' '}
        <Link to="/auth/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Create one
        </Link>
      </p>

      {/* Demo credentials */}
      <div className="mt-6 p-4 rounded-xl bg-surface-800/50 border border-white/5">
        <p className="text-surface-400 text-xs font-semibold uppercase tracking-wider mb-2">Demo Credentials</p>
        <div className="space-y-1 text-xs text-surface-300">
          <p><span className="text-surface-500">User:</span> demo@adullam.bank / Demo@123!</p>
          <p><span className="text-surface-500">Admin:</span> admin@adullam.bank / Admin@123!</p>
        </div>
      </div>
    </div>
  )
}
