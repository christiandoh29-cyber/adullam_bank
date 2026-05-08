// src/lib/ai/account-manager.ts
import { LLMClient, LLMMessage } from './llm'
import { AgentTools } from './tools'

const SYSTEM_PROMPT = `You are AdullamBank Account Manager Agent — a professional banking assistant. Help users with account guidance, card management, transfers, and general banking support. Be friendly, clear, and helpful.`

export class AccountManagerAgent {
  private llm: LLMClient
  private tools: AgentTools

  constructor(userId: string) {
    this.llm = new LLMClient()
    this.tools = new AgentTools(userId)
  }

  async chatStream(
    message: string,
    onChunk: (chunk: string) => void
  ): Promise<{ response: string }> {
    const data = await this.gatherAccountData()
    const contentPrompt = `${message}\n\nUse the following real account data to respond:\n${JSON.stringify(data, null, 2)}`

    const messages: LLMMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: contentPrompt },
    ]

    const response = await this.llm.chatStream(messages, onChunk)
    return { response: response.choices[0]?.message?.content || 'Response complete.' }
  }

  private async gatherAccountData() {
    try {
      const [profile, accounts, cards, notifications] = await Promise.all([
        this.tools.getUserProfile(),
        this.tools.getAccounts(),
        this.tools.getCards(),
        this.tools.getNotifications({ unreadOnly: true, limit: 5 }),
      ])
      return { profile, accounts, cards, notifications }
    } catch {
      return { profile: null, accounts: null, cards: null, notifications: null }
    }
  }

  async getAccountGuidance(): Promise<string> {
    const data = await this.gatherAccountData()

    const prompt = `Generate account guidance in markdown based on this data:

${JSON.stringify(data, null, 2)}

Format with sections for:
- Welcome with account summary
- Account status and balances
- Cards overview
- Quick actions
- Security tips

Be friendly and practical.`

    const response = await this.llm.chat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ])

    return response.choices[0]?.message?.content || 'Guidance generation failed.'
  }

  async getCardGuidance(): Promise<string> {
    const [cards, profile] = await Promise.all([
      this.tools.getCards(),
      this.tools.getUserProfile(),
    ])

    const prompt = `Generate card management guidance in markdown:

${JSON.stringify({ cards, profile }, null, 2)}

Include:
- Card list with masked numbers and status
- Available actions (block, limits, etc.)
- Best practices for security

Be practical and security-focused.`

    const response = await this.llm.chat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ])

    return response.choices[0]?.message?.content || 'Card guidance generation failed.'
  }

  reset(): void {}
}