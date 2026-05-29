// src/routes/ai.ts
import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { AccountantAgent, AccountManagerAgent } from '../lib/ai'

export const aiRouter = Router()
aiRouter.use(authenticate)

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  agent: z.enum(['accountant', 'account-manager']).default('accountant'),
})

aiRouter.post('/chat', async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { message, agent: agentType } = chatSchema.parse(req.body)
    const userId = req.user!.userId

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const onChunk = (chunk: string) => {
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
    }

    if (agentType === 'accountant') {
      const agent = new AccountantAgent(userId)
      await agent.chatStream(message, onChunk)
    } else {
      const agent = new AccountManagerAgent(userId)
      await agent.chatStream(message, onChunk)
    }

    res.write(`data: ${JSON.stringify({ type: 'done', agent: agentType })}\n\n`)
    res.end()
  } catch (_err) {
    if (!res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Request failed' })}\n\n`)
      res.end()
    }
  }
})

aiRouter.post('/accountant/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const agent = new AccountantAgent(userId)
    const report = await agent.generateFinancialReport()

    res.json({ success: true, report, generatedAt: new Date().toISOString() })
  } catch (err) {
    next(err)
  }
})

aiRouter.get('/account-manager/guidance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const agent = new AccountManagerAgent(userId)
    const guidance = await agent.getAccountGuidance()

    res.json({ success: true, guidance, generatedAt: new Date().toISOString() })
  } catch (err) {
    next(err)
  }
})

aiRouter.get('/account-manager/card-guidance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const agent = new AccountManagerAgent(userId)
    const guidance = await agent.getCardGuidance()

    res.json({ success: true, guidance, generatedAt: new Date().toISOString() })
  } catch (err) {
    next(err)
  }
})

aiRouter.get('/models', async (_req: Request, res: Response) => {
  const provider = process.env.NVIDIA_API_KEY ? 'nvidia' : 'openrouter'

  const models = process.env.NVIDIA_API_KEY ? [
    { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning', name: 'Nemotron 3 Nano Omni (free)', provider: 'NVIDIA' },
    { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'NVIDIA' },
    { id: 'mistralai/mixtral-8x7b-instruct-v0-1', name: 'Mixtral 8x7B', provider: 'NVIDIA' },
  ] : [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  ]

  res.json({
    success: true,
    provider,
    models,
    current: process.env.AI_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  })
})