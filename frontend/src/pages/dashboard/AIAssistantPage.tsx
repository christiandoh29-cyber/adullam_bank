// src/pages/dashboard/AIAssistantPage.tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User as UserIcon, BarChart3, CreditCard, Sparkles, ChevronDown, FileText, BookOpen } from 'lucide-react'
import { agentApi } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import { formatRelative } from '../../lib/utils'

type AgentType = 'accountant' | 'account-manager'

const AGENT_INFO = {
  accountant: {
    name: 'Accountant Agent',
    icon: BarChart3,
    color: 'from-accent-purple to-brand-500',
    description: 'Financial analysis, reports, and insights',
    prompt: 'Generate a detailed financial report for the current month',
  },
  'account-manager': {
    name: 'Account Manager',
    icon: CreditCard,
    color: 'from-accent-teal to-accent-green',
    description: 'Account guidance, card advice, and banking support',
    prompt: 'Provide account guidance and recommendations',
  },
}

const QUICK_ACTIONS = [
  { label: 'Monthly Report', icon: FileText, agent: 'accountant' as AgentType, prompt: 'Generate my financial report for this month with a full analysis' },
  { label: 'Spending Analysis', icon: BarChart3, agent: 'accountant' as AgentType, prompt: 'Analyze my recent transactions and spending patterns' },
  { label: 'Account Overview', icon: BookOpen, agent: 'account-manager' as AgentType, prompt: 'Give me a complete overview of my accounts and cards' },
  { label: 'Card Guidance', icon: CreditCard, agent: 'account-manager' as AgentType, prompt: 'Help me manage my cards and set appropriate limits' },
]

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function AIAssistantPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [activeAgent, setActiveAgent] = useState<AgentType>('accountant')
  const [isLoading, setIsLoading] = useState(false)
  const [showAgentMenu, setShowAgentMenu] = useState(false)
  const [assistantContent, setAssistantContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, assistantContent])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setAssistantContent('')

    const assistantMsg: Message = { role: 'assistant', content: '', timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, assistantMsg])

    await agentApi.chatStream(
      text.trim(),
      activeAgent,
      (chunk) => {
        setAssistantContent((prev) => prev + chunk)
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: updated[updated.length - 1].content + chunk }
          return updated
        })
      },
      () => {
        setIsLoading(false)
      },
      (err) => {
        setIsLoading(false)
        const errorMsg: Message = { role: 'assistant', content: `Error: ${err.message}`, timestamp: new Date().toISOString() }
        setMessages((prev) => {
          const updated = [...prev]
          if (updated[updated.length - 1]?.role === 'assistant' && updated[updated.length - 1]?.content === '') {
            updated[updated.length - 1] = errorMsg
          } else {
            updated.push(errorMsg)
          }
          return updated
        })
      }
    )
  }, [activeAgent, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt)
  }

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n')
    const elements: React.ReactNode[] = []
    let inTable = false
    let tableRows: string[] = []

    const flushTable = () => {
      if (tableRows.length > 0) {
        const rows = tableRows.slice(1)
        elements.push(
          <div key={elements.length} className="overflow-x-auto my-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-600">
                  {tableRows[0].split('|').filter((c) => c.trim()).map((h, i) => (
                    <th key={i} className="text-left py-2 px-3 text-surface-400 font-medium">{h.trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-surface-800">
                    {row.split('|').filter((c) => c.trim()).map((cell, ci) => (
                      <td key={ci} className="py-2 px-3 text-surface-200">{cell.trim()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        tableRows = []
        inTable = false
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) { flushTable(); inTable = true }
        tableRows.push(line)
        continue
      } else if (inTable) {
        flushTable()
      }

      if (line.startsWith('# ')) {
        elements.push(<h1 key={elements.length} className="text-xl font-bold text-white mt-4 mb-2">{line.slice(2)}</h1>)
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={elements.length} className="text-lg font-semibold text-surface-100 mt-3 mb-2">{line.slice(3)}</h2>)
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={elements.length} className="text-sm font-semibold text-surface-300 mt-2 mb-1">{line.slice(4)}</h3>)
      } else if (line.trim() === '') {
        continue
      } else {
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const formatted = line.slice(2)
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
              .replace(/`([^`]+)`/g, '<code class="bg-surface-800 text-accent-teal px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
          elements.push(
            <p key={elements.length} className="text-surface-300 text-sm leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: '• ' + formatted }} />
          )
        } else {
          const formatted = line
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
              .replace(/`([^`]+)`/g, '<code class="bg-surface-800 text-accent-teal px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
          elements.push(
            <p key={elements.length} className="text-surface-300 text-sm leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: formatted }} />
          )
        }
      }
    }

    return elements
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">AI Banking Assistant</h1>
            <p className="text-surface-400 text-xs">Powered by NVIDIA AI</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowAgentMenu(!showAgentMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card hover-surface transition-all"
          >
            {(() => {
              const info = AGENT_INFO[activeAgent]
              return (
                <>
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center`}>
                    <info.icon size={14} className="text-white" />
                  </div>
                  <span className="text-white text-sm font-medium">{info.name}</span>
                  <ChevronDown size={14} className="text-surface-400" />
                </>
              )
            })()}
          </button>

          {showAgentMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowAgentMenu(false)} />
              <div className="absolute right-0 mt-2 w-64 glass-card border border-theme z-20 overflow-hidden">
                {(Object.keys(AGENT_INFO) as AgentType[]).map((type) => {
                  const info = AGENT_INFO[type]
                  return (
                    <button
                      key={type}
                      onClick={() => { setActiveAgent(type); setShowAgentMenu(false) }}
                      className={`w-full flex items-center gap-3 p-3 hover-surface transition-colors ${activeAgent === type ? 'bg-brand-500/10' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center`}>
                        <info.icon size={16} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-white text-sm font-medium">{info.name}</p>
                        <p className="text-surface-500 text-xs">{info.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`mb-4 p-4 rounded-xl bg-gradient-to-r ${AGENT_INFO[activeAgent].color} opacity-20 border border-white/10`}>
        <p className="text-white/80 text-sm">{AGENT_INFO[activeAgent].description}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-gradient/20 flex items-center justify-center mb-4">
              <Bot size={32} className="text-brand-400" />
            </div>
            <h2 className="text-white text-lg font-semibold mb-2">
              Hello{user?.firstName ? `, ${user.firstName}` : ''}!
            </h2>
            <p className="text-surface-400 text-sm max-w-md mb-6">
              I'm your AI banking assistant powered by NVIDIA AI. Ask me about your finances, request reports, or get account guidance.
            </p>

            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="glass-card p-3 flex items-center gap-3 hover-surface transition-all group"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${AGENT_INFO[action.agent].color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <action.icon size={14} className="text-white" />
                  </div>
                  <span className="text-surface-300 text-xs font-medium group-hover:text-white transition-colors text-left">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
              ? 'bg-brand-gradient'
              : `bg-gradient-to-br ${AGENT_INFO[activeAgent].color}`
            }`}>
              {msg.role === 'user' ? <UserIcon size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
            </div>
            <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block p-4 rounded-2xl ${msg.role === 'user'
                ? 'bg-brand-600/30 text-white rounded-tr-sm'
                : 'glass-card text-surface-200 rounded-tl-sm'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
              <p className="text-surface-600 text-xs mt-1 px-1">{formatRelative(msg.timestamp)}</p>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 pt-2 border-t border-theme">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage(input)
            }
          }}
          placeholder={`Ask your ${AGENT_INFO[activeAgent].name.toLowerCase()} anything...`}
          className="flex-1 bg-surface-800 border border-theme rounded-xl px-4 py-3 text-white text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500 transition-colors resize-none"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-5 py-3 rounded-xl bg-brand-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send size={16} />
          Send
        </button>
      </form>
    </div>
  )
}