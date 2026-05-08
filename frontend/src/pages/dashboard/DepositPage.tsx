// src/pages/dashboard/DepositPage.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, CheckCircle, Clock, Loader2, Info } from 'lucide-react'
import { transactionApi } from '../../lib/api'
import { formatAmount, formatDate, getStatusBadge } from '../../lib/utils'
import { cn } from '../../lib/utils'

const schema = z.object({
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 10, 'Minimum deposit is €10'),
  note: z.string().max(500).optional(),
})
type FormData = z.infer<typeof schema>

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000, 5000]

interface DepositRequest {
  id: string
  amount: number | string
  currency: string
  status: string
  note?: string
  adminNote?: string
  createdAt: string
  processedAt?: string
}

export default function DepositPage() {
  const [success, setSuccess] = useState(false)
  const qc = useQueryClient()

  const { data: historyData } = useQuery({
    queryKey: ['deposit-requests'],
    queryFn: () => transactionApi.getMyDepositRequests().then((r) => r.data),
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const depositMutation = useMutation({
    mutationFn: (data: FormData) =>
      transactionApi.requestDeposit({ amount: Number(data.amount), note: data.note }),
    onSuccess: () => {
      setSuccess(true)
      reset()
      qc.invalidateQueries({ queryKey: ['deposit-requests'] })
    },
  })

  const deposits: DepositRequest[] = historyData?.deposits ?? []

  if (success) {
    return (
      <div className="max-w-md mx-auto animate-slide-up">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-accent-green/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-accent-green" size={32} />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Request Submitted!</h2>
          <p className="text-surface-400 text-sm mb-6">
            Your deposit request has been submitted. An admin will review and process it shortly.
          </p>
          <button onClick={() => setSuccess(false)} className="brand-btn">
            Submit Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-white text-2xl font-bold">Request Deposit</h1>
        <p className="text-surface-400 text-sm mt-1">Submit a deposit request — our team will process it</p>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div>
          <label className="block text-surface-300 text-sm font-medium mb-3">Quick Amount</label>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setValue('amount', String(a))}
                className={cn(
                  'py-2.5 rounded-xl border text-sm font-medium transition-all',
                  watch('amount') === String(a)
                    ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                    : 'bg-surface-800 border-theme text-surface-300 hover:border-brand-500/30 hover:text-white'
                )}
              >
                €{a.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-surface-300 text-sm font-medium mb-1.5">Custom Amount (EUR)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400">€</span>
            <input
              {...register('amount')}
              type="number"
              min="10"
              step="0.01"
              placeholder="Enter amount..."
              className={cn('input-field pl-8', errors.amount && 'border-accent-rose/50')}
            />
          </div>
          {errors.amount && <p className="mt-1 text-accent-rose text-xs">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-surface-300 text-sm font-medium mb-1.5">Note (optional)</label>
          <textarea
            {...register('note')}
            placeholder="Payment method, reference number..."
            rows={2}
            className="input-field resize-none"
          />
        </div>

        <button
          onClick={handleSubmit((d) => depositMutation.mutate(d))}
          disabled={depositMutation.isPending}
          className="brand-btn w-full flex items-center justify-center gap-2"
        >
          {depositMutation.isPending
            ? <><Loader2 size={17} className="animate-spin" /> Submitting...</>
            : <><Download size={17} /> Request Deposit</>}
        </button>
      </div>

      <div className="flex items-start gap-2 text-surface-500 text-xs">
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <p>Deposits are reviewed by our team within 24 hours. You will be notified by email once your deposit is processed.</p>
      </div>

      {/* History */}
      {deposits.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-theme">
            <h3 className="text-white font-semibold text-sm">Deposit History</h3>
          </div>
          <div className="divide-y divide-white/5">
            {deposits.map((d) => (
              <div key={d.id} className="flex items-center gap-4 p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  d.status === 'APPROVED' ? 'bg-accent-green/10' :
                  d.status === 'REJECTED' ? 'bg-accent-rose/10' : 'bg-accent-amber/10'
                }`}>
                  {d.status === 'APPROVED' ? <CheckCircle size={16} className="text-accent-green" /> :
                   d.status === 'REJECTED' ? <CheckCircle size={16} className="text-accent-rose" /> :
                   <Clock size={16} className="text-accent-amber" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">
                    Deposit Request — {formatAmount(Number(d.amount), d.currency)}
                  </p>
                  <p className="text-surface-500 text-xs">{formatDate(d.createdAt)}</p>
                  {d.adminNote && <p className="text-surface-400 text-xs italic mt-0.5">"{d.adminNote}"</p>}
                </div>
                <span className={`badge ${getStatusBadge(d.status)}`}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
