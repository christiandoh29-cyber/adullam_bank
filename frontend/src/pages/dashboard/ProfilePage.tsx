// src/pages/dashboard/ProfilePage.tsx
import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Lock, CheckCircle, Loader2, Eye, EyeOff, Camera, Trash2 } from 'lucide-react'
import { userApi } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import { getInitials } from '../../lib/utils'
import { cn } from '../../lib/utils'

const profileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8).regex(/(?=.*[A-Z])/).regex(/(?=.*\d)/),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
})

type ProfileData = z.infer<typeof profileSchema>
type PasswordData = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user?.firstName, lastName: user?.lastName },
  })

  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })

  const updateProfile = useMutation({
    mutationFn: (data: ProfileData) => userApi.updateProfile(data),
    onSuccess: (res) => {
      setUser({ ...user!, ...res.data.user })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    },
  })

  const uploadPicture = useMutation({
    mutationFn: (file: File) => userApi.uploadProfilePicture(file),
    onSuccess: (res) => {
      setUser({ ...user!, profilePicture: res.data.profilePicture })
      qc.invalidateQueries({ queryKey: ['notifications'] })
      setUploadError('')
    },
    onError: () => {
      setUploadError('Failed to upload photo. Max size: 500KB')
    },
  })

  const deletePicture = useMutation({
    mutationFn: () => userApi.deleteProfilePicture(),
    onSuccess: () => {
      setUser({ ...user!, profilePicture: null })
    },
  })

  const updatePassword = useMutation({
    mutationFn: (data: PasswordData) => userApi.updatePassword(data),
    onSuccess: () => {
      passwordForm.reset()
      setPasswordSuccess(true)
      setTimeout(() => setPasswordSuccess(false), 3000)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) {
      setUploadError('File too large. Max size is 500KB.')
      return
    }
    setUploadError('')
    uploadPicture.mutate(file)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-white text-2xl font-bold">Profile</h1>
        <p className="text-surface-400 text-sm mt-1">Manage your personal information</p>
      </div>

      {/* Avatar */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="relative group flex-shrink-0">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt="Profile"
              className="w-14 h-14 rounded-2xl object-cover shadow-brand-sm"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center text-white text-xl font-bold shadow-brand-sm">
              {user ? getInitials(user.firstName, user.lastName) : 'U'}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadPicture.isPending}
            className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="Change photo"
          >
            {uploadPicture.isPending ? (
              <Loader2 size={18} className="text-white animate-spin" />
            ) : (
              <Camera size={18} className="text-white" />
            )}
          </button>
          {user?.profilePicture && (
            <button
              onClick={() => deletePicture.mutate()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent-rose flex items-center justify-center shadow-md hover:bg-accent-rose/80 transition-colors"
              title="Remove photo"
            >
              <Trash2 size={11} className="text-white" />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div>
          <p className="text-white font-semibold">{user?.firstName} {user?.lastName}</p>
          <p className="text-surface-400 text-sm">{user?.email}</p>
          {uploadError && (
            <p className="text-accent-rose text-xs mt-1">{uploadError}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge ${user?.isEmailVerified ? 'badge-green' : 'badge-yellow'}`}>
              {user?.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
            </span>
            <span className="badge badge-purple capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={17} className="text-brand-400" />
          <h3 className="text-white font-semibold text-sm">Personal Information</h3>
        </div>

        <form onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-surface-300 text-sm font-medium mb-1.5">First Name</label>
              <input {...profileForm.register('firstName')} className="input-field" />
            </div>
            <div>
              <label className="block text-surface-300 text-sm font-medium mb-1.5">Last Name</label>
              <input {...profileForm.register('lastName')} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-surface-300 text-sm font-medium mb-1.5">Phone</label>
            <input {...profileForm.register('phone')} placeholder="+225 00 00 00 00" className="input-field" />
          </div>

          {profileSuccess && (
            <div className="flex items-center gap-2 text-accent-green text-sm">
              <CheckCircle size={16} /> Profile updated successfully
            </div>
          )}

          <button type="submit" disabled={updateProfile.isPending} className="brand-btn flex items-center gap-2">
            {updateProfile.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
            Save Changes
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={17} className="text-brand-400" />
          <h3 className="text-white font-semibold text-sm">Change Password</h3>
        </div>

        <form onSubmit={passwordForm.handleSubmit((d) => updatePassword.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-surface-300 text-sm font-medium mb-1.5">Current Password</label>
            <div className="relative">
              <input
                {...passwordForm.register('currentPassword')}
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                className={cn('input-field pr-11', passwordForm.formState.errors.currentPassword && 'border-accent-rose/50')}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-surface-300 text-sm font-medium mb-1.5">New Password</label>
            <input
              {...passwordForm.register('newPassword')}
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              className={cn('input-field', passwordForm.formState.errors.newPassword && 'border-accent-rose/50')}
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="mt-1 text-accent-rose text-xs">{passwordForm.formState.errors.newPassword.message}</p>
            )}
          </div>
          <div>
            <label className="block text-surface-300 text-sm font-medium mb-1.5">Confirm New Password</label>
            <input
              {...passwordForm.register('confirmPassword')}
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              className={cn('input-field', passwordForm.formState.errors.confirmPassword && 'border-accent-rose/50')}
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="mt-1 text-accent-rose text-xs">{passwordForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          {updatePassword.isError && (
            <p className="text-accent-rose text-sm">
              {(updatePassword.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed'}
            </p>
          )}
          {passwordSuccess && (
            <div className="flex items-center gap-2 text-accent-green text-sm">
              <CheckCircle size={16} /> Password updated successfully
            </div>
          )}

          <button type="submit" disabled={updatePassword.isPending} className="brand-btn flex items-center gap-2">
            {updatePassword.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}
