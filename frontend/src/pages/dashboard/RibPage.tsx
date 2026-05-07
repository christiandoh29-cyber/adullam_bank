// src/pages/dashboard/RibPage.tsx
import { useQuery } from '@tanstack/react-query'
import { Copy, CheckCheck, Download, FileText } from 'lucide-react'
import { useState } from 'react'
import { accountApi } from '../../lib/api'

interface RibData {
  bankCode: string
  branchCode: string
  accountNumber: string
  ribKey: string
  iban: string
  accountHolder: string
  bic: string
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-300 hover:text-white text-xs transition-colors"
    >
      {copied ? <CheckCheck size={13} className="text-accent-green" /> : <Copy size={13} />}
      {copied ? 'Copied!' : `Copy ${label}`}
    </button>
  )
}

function RibField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-surface-400 text-xs mb-0.5">{label}</p>
        <p className={`text-white text-sm font-medium ${mono ? 'font-mono tracking-wide' : ''}`}>{value}</p>
      </div>
      <CopyButton value={value} label={label} />
    </div>
  )
}

export default function RibPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['rib'],
    queryFn: () => accountApi.getRib().then((r) => r.data),
  })

  const rib: RibData | undefined = data?.rib

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-white text-2xl font-bold">My RIB / IBAN</h1>
        <p className="text-surface-400 text-sm mt-1">Your bank account details for receiving transfers</p>
      </div>

      {isLoading ? (
        <div className="glass-card p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="w-24 h-3 shimmer-bg rounded" />
              <div className="w-48 h-4 shimmer-bg rounded" />
            </div>
          ))}
        </div>
      ) : rib ? (
        <>
          {/* IBAN highlight */}
          <div className="glass-card p-5 bg-gradient-to-br from-brand-500/10 to-transparent border border-brand-500/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-brand-300 text-xs font-semibold uppercase tracking-wider mb-2">IBAN</p>
                <p className="text-white text-lg font-mono font-bold tracking-wider">{rib.iban}</p>
                <p className="text-surface-400 text-sm mt-1">{rib.accountHolder}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
                <FileText className="text-brand-400" size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <CopyButton value={rib.iban} label="IBAN" />
              <CopyButton value={rib.bic} label="BIC" />
            </div>
          </div>

          {/* All RIB fields */}
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Complete Bank Details</h3>
            <RibField label="Account Holder" value={rib.accountHolder} />
            <RibField label="Bank Code (Code Banque)" value={rib.bankCode} mono />
            <RibField label="Branch Code (Code Guichet)" value={rib.branchCode} mono />
            <RibField label="Account Number (Numéro de Compte)" value={rib.accountNumber} mono />
            <RibField label="RIB Key (Clé RIB)" value={rib.ribKey} mono />
            <RibField label="IBAN" value={rib.iban} mono />
            <RibField label="BIC / SWIFT" value={rib.bic} mono />
          </div>

          {/* Info */}
          <div className="glass-card p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-teal/10 flex items-center justify-center flex-shrink-0">
              <Download size={16} className="text-accent-teal" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Download your RIB</p>
              <p className="text-surface-400 text-xs mt-0.5">
                PDF download is available in the full desktop version. Share your IBAN to receive bank transfers from any European bank.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card p-12 text-center">
          <p className="text-surface-400 text-sm">No account found. Please contact support.</p>
        </div>
      )}
    </div>
  )
}
