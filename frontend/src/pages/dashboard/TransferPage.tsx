// src/pages/dashboard/TransferPage.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { transactionApi, accountApi } from '../../lib/api'
import { formatAmount } from '../../lib/utils'
import { cn } from '../../lib/utils'

const schema = z.object({
  toIban: z.string().min(10, 'Enter a valid IBAN'),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount'),
  description: z.string().max(200).optional(),
})

type FormData = z.infer<typeof schema>

export default function TransferPage() {
  const [success, setSuccess] = useState<{ reference: string; amount: number } | null>(null)
  const [error, setError] = useState('')
  const qc = useQueryClient()

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountApi.getAll().then((r) => r.data),
  })

  const account = accountsData?.accounts?.[0]
  const balance = Number(account?.balance ?? 0)

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const amountVal = Number(watch('amount') || 0)
  const fee = amountVal > 10 ? Math.min(amountVal * 0.005, 10) : 0
  const total = amountVal + fee
  const canAfford = balance >= total

  const transferMutation = useMutation({
    mutationFn: (data: FormData) =>
      transactionApi.transfer({ toIban: data.toIban, amount: Number(data.amount), description: data.description }),
    onSuccess: (res) => {
      setSuccess({ reference: res.data.transaction.reference, amount: amountVal })
      reset()
      qc.invalidateQueries({ queryKey: ['accounts'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Transfer failed')
    },
  })

  const onSubmit = (data: FormData) => {
    setError('')
    transferMutation.mutate(data)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto animate-slide-up">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-accent-green/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-accent-green" size={32} />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Transfer Sent!</h2>
          <p className="text-surface-400 text-sm mb-1">
            {formatAmount(success.amount)} has been transferred successfully.
          </p>
          <p className="text-surface-500 text-xs font-mono mt-2">{success.reference}</p>

          <div className="mt-6 flex gap-3">
            <button onClick={() => setSuccess(null)} className="flex-1 brand-btn">
              New Transfer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-white text-2xl font-bold">Send Money</h1>
        <p className="text-surface-400 text-sm mt-1">Transfer funds to any IBAN</p>
      </div>

      {/* Balance info */}
      {account && (
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
            <ArrowRight size={18} className="text-brand-400" />
          </div>
          <div>
            <p className="text-surface-400 text-xs">Available balance</p>
            <p className="text-white font-bold">{formatAmount(balance)}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 flex items-center gap-2 text-accent-rose text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-5 space-y-4">
        <div>
          <label className="block text-surface-300 text-sm font-medium mb-1.5">
            Recipient IBAN
          </label>
          <input
            {...register('toIban')}
            placeholder="FR76 3000 6000 0112 3456 7890 189"
            className={cn('input-field font-mono', errors.toIban && 'border-accent-rose/50')}
          />
          {errors.toIban && <p className="mt-1 text-accent-rose text-xs">{errors.toIban.message}</p>}
        </div>

        <div>
          <label className="block text-surface-300 text-sm font-medium mb-1.5">Amount (EUR)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 font-medium">€</span>
            <input
              {...register('amount')}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className={cn('input-field pl-8', errors.amount && 'border-accent-rose/50', !canAfford && amountVal > 0 && 'border-accent-rose/50')}
            />
          </div>
          {errors.amount && <p className="mt-1 text-accent-rose text-xs">{errors.amount.message}</p>}
          {!canAfford && amountVal > 0 && (
            <p className="mt-1 text-accent-rose text-xs">Insufficient balance for this transfer + fees</p>
          )}
        </div>

        <div>
          <label className="block text-surface-300 text-sm font-medium mb-1.5">Description (optional)</label>
          <input
            {...register('description')}
            placeholder="Payment for services..."
            className="input-field"
          />
        </div>

        {/* Fee summary */}
        {amountVal > 0 && (
          <div className="bg-surface-800/50 rounded-xl p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between text-surface-400">
              <span>Amount</span>
              <span className="text-white">{formatAmount(amountVal)}</span>
            </div>
            <div className="flex items-center justify-between text-surface-400">
              <span className="flex items-center gap-1">
                Fee
                <Info size={12} className="text-surface-500" aria-label="0.5% fee, max €10, free under €10" />
              </span>
              <span className="text-white">{formatAmount(fee)}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex items-center justify-between">
              <span className="text-surface-300 font-medium">Total debit</span>
              <span className={`font-bold ${canAfford ? 'text-white' : 'text-accent-rose'}`}>
                {formatAmount(total)}
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || transferMutation.isPending || !canAfford || amountVal <= 0}
          className="brand-btn w-full flex items-center justify-center gap-2"
        >
          {transferMutation.isPending
            ? <><Loader2 size={17} className="animate-spin" /> Processing...</>
            : <><ArrowRight size={17} /> Send Transfer</>}
        </button>
      </form>

      <div className="flex items-start gap-2 text-surface-500 text-xs">
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        <p>Transfers are processed instantly. A fee of 0.5% (max €10) applies to transfers over €10. All transfers are irreversible.</p>
      </div>
    </div>
  )
}
