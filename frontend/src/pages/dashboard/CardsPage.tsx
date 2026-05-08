// src/pages/dashboard/CardsPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, EyeOff, Lock, Unlock, Loader2, CreditCard } from 'lucide-react'
import { cardApi } from '../../lib/api'
import { formatCardNumber, formatExpiry, maskCardNumber, formatAmount } from '../../lib/utils'

interface Card {
  id: string
  cardNumber: string
  cardHolder: string
  expiryMonth: number
  expiryYear: number
  cvv: string
  network: 'VISA' | 'MASTERCARD'
  status: 'ACTIVE' | 'BLOCKED' | 'EXPIRED' | 'CANCELLED'
  dailyLimit: number | string
  monthlyLimit: number | string
}

function CardVisual({ card, showDetails }: { card: Card; showDetails: boolean }) {
  const isVisa = card.network === 'VISA'
  const isBlocked = card.status === 'BLOCKED'

  return (
    <div className="dark relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden select-none transition-all duration-300 ${isBlocked ? 'opacity-60 grayscale' : ''}">
      {/* Card background */}
      <div className={`absolute inset-0 ${isVisa
        ? 'bg-gradient-to-br from-[#1a1a3e] via-[#0f2744] to-[#1a1a2e]'
        : 'bg-gradient-to-br from-[#1c0a3e] via-[#2d1244] to-[#1a0a2e]'
      }`} />

      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-12 -left-8 w-48 h-48 rounded-full bg-white/3" />

      {/* Brand gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-transparent" />

      {/* Card content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-5">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Adullam Bank</p>
            {isBlocked && (
              <span className="mt-1 inline-flex items-center gap-1 text-accent-rose text-xs font-semibold">
                <Lock size={10} /> BLOCKED
              </span>
            )}
          </div>
          <div className={`text-right text-lg font-black italic tracking-tight ${isVisa ? 'text-white' : 'text-accent-amber'}`}>
            {isVisa ? 'VISA' : 'MC'}
          </div>
        </div>

        {/* Chip */}
        <div className="w-10 h-7 rounded-md bg-gradient-to-br from-accent-amber/80 to-accent-amber/40 border border-accent-amber/30" />

        {/* Card number */}
        <div>
          <p className="text-white font-mono text-sm tracking-[0.2em] mb-3">
            {showDetails ? formatCardNumber(card.cardNumber) : maskCardNumber(card.cardNumber)}
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Card Holder</p>
              <p className="text-white text-sm font-semibold tracking-wide">{card.cardHolder}</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Expires</p>
              <p className="text-white text-sm font-semibold">{formatExpiry(card.expiryMonth, card.expiryYear)}</p>
            </div>
            {showDetails && (
              <div className="text-right">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">CVV</p>
                <p className="text-white text-sm font-semibold">{card.cvv}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CardsPage() {
  const qc = useQueryClient()
  const [showDetailsId, setShowDetailsId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: () => cardApi.getAll().then((r) => r.data),
  })

  const createCard = useMutation({
    mutationFn: () => cardApi.create(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards'] }),
  })

  const blockMutation = useMutation({
    mutationFn: (id: string) => cardApi.block(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards'] }),
  })

  const unblockMutation = useMutation({
    mutationFn: (id: string) => cardApi.unblock(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards'] }),
  })

  const cards: Card[] = data?.cards ?? []

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">My Cards</h1>
          <p className="text-surface-400 text-sm mt-1">Manage your virtual cards</p>
        </div>
        <button
          onClick={() => createCard.mutate()}
          disabled={createCard.isPending || cards.length >= 3}
          className="brand-btn flex items-center gap-2 text-sm"
        >
          {createCard.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          New Card
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((i) => <div key={i} className="aspect-[1.586/1] shimmer-bg rounded-2xl" />)}
        </div>
      ) : cards.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CreditCard className="text-surface-600 mx-auto mb-3" size={40} />
          <p className="text-surface-400 text-sm">No cards yet. Create your first virtual card.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="space-y-3">
              <CardVisual card={card} showDetails={showDetailsId === card.id} />

              {/* Card actions */}
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`badge ${card.status === 'ACTIVE' ? 'badge-green' : card.status === 'BLOCKED' ? 'badge-red' : 'badge-gray'}`}>
                    {card.status}
                  </span>
                  <span className="badge badge-purple">{card.network}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-surface-400">
                  <div>
                    <p className="text-surface-500 text-xs">Daily limit</p>
                    <p className="text-white font-medium">{formatAmount(Number(card.dailyLimit))}</p>
                  </div>
                  <div>
                    <p className="text-surface-500 text-xs">Monthly limit</p>
                    <p className="text-white font-medium">{formatAmount(Number(card.monthlyLimit))}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDetailsId(showDetailsId === card.id ? null : card.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-700 hover:bg-surface-600 text-white text-xs font-medium transition-colors"
                  >
                    {showDetailsId === card.id ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showDetailsId === card.id ? 'Hide' : 'Show'} Details
                  </button>

                  {card.status === 'ACTIVE' ? (
                    <button
                      onClick={() => blockMutation.mutate(card.id)}
                      disabled={blockMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-accent-rose/10 hover:bg-accent-rose/20 text-accent-rose text-xs font-medium transition-colors"
                    >
                      {blockMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                      Block
                    </button>
                  ) : (
                    <button
                      onClick={() => unblockMutation.mutate(card.id)}
                      disabled={unblockMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-accent-green/10 hover:bg-accent-green/20 text-accent-green text-xs font-medium transition-colors"
                    >
                      {unblockMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />}
                      Unblock
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cards.length > 0 && cards.length < 3 && (
        <p className="text-surface-500 text-xs text-center">
          You can create up to 3 cards per account ({3 - cards.length} remaining)
        </p>
      )}
    </div>
  )
}
