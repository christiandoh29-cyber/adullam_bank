// // src/pages/auth/LoginPage.tsx
// import { useState } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { z } from 'zod'
// import { Eye, EyeOff, Loader2 } from 'lucide-react'
// import { authApi } from '../../lib/api'
// import { useAuthStore } from '../../store/auth'
// import { cn } from '../../lib/utils'

// const schema = z.object({
//   email: z.string().email('Invalid email'),
//   password: z.string().min(1, 'Password is required'),
// })

// type FormData = z.infer<typeof schema>

// export default function LoginPage() {
//   const [showPassword, setShowPassword] = useState(false)
//   const [error, setError] = useState('')
//   const { setUser } = useAuthStore()
//   const navigate = useNavigate()

//   const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
//     resolver: zodResolver(schema),
//   })

//   const onSubmit = async (data: FormData) => {
//     setError('')
//     try {
//       const res = await authApi.login(data)
//       setUser(res.data.user)
//       navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true })
//     } catch (err: unknown) {
//       const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed'
//       setError(msg)
//     }
//   }

//   return (
//     <div className="animate-slide-up">
//       <div className="mb-8">
//         <h2 className="text-white text-2xl font-bold">Welcome back</h2>
//         <p className="text-surface-400 text-sm mt-1">Sign in to your Adullam Bank account</p>
//       </div>

//       {error && (
//         <div className="mb-4 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm">
//           {error}
//         </div>
//       )}

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//         <div>
//           <label className="block text-surface-300 text-sm font-medium mb-1.5">Email</label>
//           <input
//             {...register('email')}
//             type="email"
//             placeholder="you@example.com"
//             className={cn('input-field', errors.email && 'border-accent-rose/50 focus:ring-accent-rose/30')}
//             autoComplete="email"
//           />
//           {errors.email && <p className="mt-1 text-accent-rose text-xs">{errors.email.message}</p>}
//         </div>

//         <div>
//           <label className="block text-surface-300 text-sm font-medium mb-1.5">Password</label>
//           <div className="relative">
//             <input
//               {...register('password')}
//               type={showPassword ? 'text' : 'password'}
//               placeholder="••••••••"
//               className={cn('input-field pr-11', errors.password && 'border-accent-rose/50')}
//               autoComplete="current-password"
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white transition-colors"
//             >
//               {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
//             </button>
//           </div>
//           {errors.password && <p className="mt-1 text-accent-rose text-xs">{errors.password.message}</p>}
//         </div>

//         <div className="flex items-center justify-end">
//           <Link to="/auth/forgot-password" className="text-brand-400 hover:text-brand-300 text-sm transition-colors">
//             Forgot password?
//           </Link>
//         </div>

//         <button type="submit" disabled={isSubmitting} className="brand-btn w-full flex items-center justify-center gap-2">
//           {isSubmitting ? <><Loader2 size={17} className="animate-spin" /> Signing in...</> : 'Sign In'}
//         </button>
//       </form>

//       <p className="text-center text-surface-400 text-sm mt-6">
//         Don't have an account?{' '}
//         <Link to="/auth/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
//           Create one
//         </Link>
//       </p>

//       {/* Demo credentials */}
//       <div className="mt-6 p-4 rounded-xl bg-surface-800/50 border border-white/5">
//         <p className="text-surface-400 text-xs font-semibold uppercase tracking-wider mb-2">Demo Credentials</p>
//         <div className="space-y-1 text-xs text-surface-300">
//           <p><span className="text-surface-500">User:</span> demo@adullam.bank / Demo@123!</p>
//           <p><span className="text-surface-500">Admin:</span> admin@adullam.bank / Admin@123!</p>
//         </div>
//       </div>
//     </div>
//   )
// }


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
  const [shake, setShake] = useState(false)
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
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="animate-slide-up">
      {/* Header avec animation de fade et slide */}
      <div className="mb-8 animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-white text-2xl font-bold bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-transparent">
          Welcome back
        </h2>
        <p className="text-surface-400 text-sm mt-1 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Sign in to your Adullam Bank account
        </p>
      </div>

      {/* Message d'erreur avec animation */}
      {error && (
        <div className={cn(
          'mb-4 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm',
          'animate-slide-down-bounce',
          shake && 'animate-shake'
        )}>
          {error}
        </div>
      )}

      {/* Formulaire avec animations en cascade */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email field */}
        <div 
          className="animate-slide-up"
          style={{ 
            animationDelay: '0.15s',
            animationFillMode: 'both'
          }}
        >
          <label className="block text-surface-300 text-sm font-medium mb-1.5 transition-colors duration-300">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@example.com"
            className={cn(
              'input-field transition-all duration-300',
              'focus:scale-[1.02] hover:border-brand-400/50',
              errors.email && 'border-accent-rose/50 focus:ring-accent-rose/30 animate-pulse-error'
            )}
            autoComplete="email"
          />
          {errors.email && (
            <p className="mt-1 text-accent-rose text-xs animate-fade-in">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password field */}
        <div 
          className="animate-slide-up"
          style={{ 
            animationDelay: '0.25s',
            animationFillMode: 'both'
          }}
        >
          <label className="block text-surface-300 text-sm font-medium mb-1.5 transition-colors duration-300">
            Password
          </label>
          <div className="relative group">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={cn(
                'input-field pr-11 transition-all duration-300',
                'focus:scale-[1.02] hover:border-brand-400/50',
                errors.password && 'border-accent-rose/50 animate-pulse-error'
              )}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 text-surface-400',
                'hover:text-white transition-all duration-300',
                'hover:scale-110 active:scale-95'
              )}
            >
              {showPassword ? (
                <EyeOff size={17} className="animate-fade-in" />
              ) : (
                <Eye size={17} className="animate-fade-in" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-accent-rose text-xs animate-fade-in">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Forgot password link */}
        <div 
          className="flex items-center justify-end animate-slide-up"
          style={{ 
            animationDelay: '0.35s',
            animationFillMode: 'both'
          }}
        >
          <Link 
            to="/auth/forgot-password" 
            className="text-brand-400 hover:text-brand-300 text-sm transition-all duration-300 hover:translate-x-1"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit button */}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={cn(
            'brand-btn w-full flex items-center justify-center gap-2',
            'animate-slide-up transition-all duration-300',
            'hover:scale-[1.02] active:scale-95',
            isSubmitting && 'opacity-90'
          )}
          style={{ 
            animationDelay: '0.45s',
            animationFillMode: 'both'
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={17} className="animate-spin" /> 
              <span className="animate-pulse">Signing in...</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Sign up link */}
      <p 
        className="text-center text-surface-400 text-sm mt-6 animate-fade-in"
        style={{ animationDelay: '0.55s' }}
      >
        Don't have an account?{' '}
        <Link 
          to="/auth/register" 
          className="text-brand-400 hover:text-brand-300 font-medium transition-all duration-300 hover:scale-105 inline-block"
        >
          Create one
        </Link>
      </p>

      {/* Demo credentials */}
      <div 
        className="mt-6 p-4 rounded-xl bg-surface-800/50 border border-white/5 animate-slide-up transition-all duration-300 hover:border-white/10 hover:bg-surface-800/70"
        style={{ 
          animationDelay: '0.65s',
          animationFillMode: 'both'
        }}
      >
        <p className="text-surface-400 text-xs font-semibold uppercase tracking-wider mb-2 animate-fade-in">
          Demo Credentials
        </p>
        <div className="space-y-1 text-xs text-surface-300">
          <p className="transition-all duration-300 hover:translate-x-1">
            <span className="text-surface-500">User:</span> demo@adullam.bank / Demo@123!
          </p>
          <p className="transition-all duration-300 hover:translate-x-1">
            <span className="text-surface-500">Admin:</span> admin@adullam.bank / Admin@123!
          </p>
        </div>
      </div>
    </div>
  )
}
