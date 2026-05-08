// src/lib/ai/llm.ts
import axios from 'axios'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  id: string
  model: string
  choices: Array<{
    index: number
    message: LLMMessage
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface StreamChunk {
  id?: string
  model?: string
  choices?: Array<{
    index: number
    delta?: { content?: string }
    finish_reason?: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class LLMClient {
  private apiKey: string
  private baseURL: string
  private model: string

  constructor() {
    if (process.env.NVIDIA_API_KEY) {
      this.apiKey = process.env.NVIDIA_API_KEY
      this.baseURL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'
      this.model = process.env.AI_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'
    } else if (process.env.OPENROUTER_API_KEY) {
      this.apiKey = process.env.OPENROUTER_API_KEY
      this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
      this.model = process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet'
    } else {
      throw new Error('No AI API key configured. Set NVIDIA_API_KEY or OPENROUTER_API_KEY in your .env file.')
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  async chat(
    messages: LLMMessage[],
    temperature = 0.6,
    maxTokens = 65536
  ): Promise<LLMResponse> {
    const isNvidia = this.baseURL.includes('nvidia')

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }

    if (isNvidia) {
      body.top_p = 0.95
      body.extra_body = {
        chat_template_kwargs: { enable_thinking: false },
        reasoning_budget: 16384,
      }
    }

    const response = await axios.post<LLMResponse>(`${this.baseURL}/chat/completions`, body, {
      headers: this.getHeaders(),
      timeout: 180000,
    })

    return response.data
  }

  async chatStream(
    messages: LLMMessage[],
    onChunk: (chunk: string) => void,
    temperature = 0.6,
    maxTokens = 65536
  ): Promise<LLMResponse> {
    const isNvidia = this.baseURL.includes('nvidia')

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }

    if (isNvidia) {
      body.top_p = 0.95
      body.extra_body = {
        chat_template_kwargs: { enable_thinking: false },
        reasoning_budget: 16384,
      }
    }

    const response = await axios.post(`${this.baseURL}/chat/completions`, body, {
      headers: this.getHeaders(),
      timeout: 180000,
      responseType: 'stream',
    })

    return new Promise<LLMResponse>((resolve, reject) => {
      let buffer = ''
      let fullResponse: LLMResponse | null = null

      const stream = response.data as NodeJS.ReadableStream

      stream.on('data', (chunk: Buffer) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed: StreamChunk = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta

              if (delta?.content) {
                onChunk(delta.content)
                if (!fullResponse) {
                  fullResponse = {
                    id: parsed.id || 'unknown',
                    model: parsed.model || this.model,
                    choices: [{
                      index: 0,
                      message: { role: 'assistant', content: '' },
                      finish_reason: '',
                    }],
                  }
                }
                fullResponse.choices[0].message.content += delta.content
              }

              if (parsed.usage && fullResponse) {
                fullResponse.usage = parsed.usage
              }
            } catch {
              // Skip malformed JSON in stream
            }
          }
        }
      })

      stream.on('end', () => {
        resolve(fullResponse || {
          id: 'unknown',
          model: this.model,
          choices: [{
            index: 0,
            message: { role: 'assistant', content: '' },
            finish_reason: 'stop',
          }],
        })
      })

      stream.on('error', reject)
    })
  }

  getModelName(): string {
    return this.model
  }

  getProvider(): string {
    return this.baseURL.includes('nvidia') ? 'nvidia' : 'openrouter'
  }
}