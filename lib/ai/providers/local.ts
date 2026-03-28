/**
 * Local AI Provider
 * Supports Ollama, LM Studio, and OpenAI-compatible local endpoints
 */

import { AIProvider } from '../types';

export class LocalProvider implements AIProvider {
  private endpoint: string;

  constructor(endpoint: string = 'http://localhost:11434') {
    this.endpoint = endpoint.replace(/\/$/, ''); // Remove trailing slash
  }

  isConfigured(): boolean {
    return true; // Local provider doesn't need API keys
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check Ollama API
      const response = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Server returned ${response.status}`,
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Connection failed',
      };
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('Failed to list local models:', error);
      return [];
    }
  }

  async complete(
    messages: Array<{ role: string; content: string }>,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      jsonMode?: boolean;
    } = {}
  ): Promise<{
    content: string;
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  }> {
    const model = options.model || 'llama3.1:8b';

    // Build prompt from messages (Ollama expects a single prompt)
    const prompt = this.buildPrompt(messages);

    const response = await fetch(`${this.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 4096,
        },
        format: options.jsonMode ? 'json' : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.response,
      usage: {
        inputTokens: data.prompt_eval_count || 0,
        outputTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
    };
  }

  async generateEmbedding(
    text: string,
    model: string = 'nomic-embed-text'
  ): Promise<{
    embedding: number[];
    usage: { tokens: number };
  }> {
    const response = await fetch(`${this.endpoint}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      embedding: data.embedding,
      usage: {
        tokens: Math.ceil(text.length / 4), // Rough estimate
      },
    };
  }

  async generateEmbeddings(
    texts: string[],
    model: string = 'nomic-embed-text'
  ): Promise<{
    embeddings: number[][];
    usage: { tokens: number };
  }> {
    // Ollama doesn't support batch embeddings, so we do them sequentially
    const embeddings: number[][] = [];
    let totalTokens = 0;

    for (const text of texts) {
      const result = await this.generateEmbedding(text, model);
      embeddings.push(result.embedding);
      totalTokens += result.usage.tokens;
    }

    return {
      embeddings,
      usage: { tokens: totalTokens },
    };
  }

  private buildPrompt(messages: Array<{ role: string; content: string }>): string {
    // Convert chat messages to a single prompt
    return messages
      .map(msg => {
        if (msg.role === 'system') return `System: ${msg.content}`;
        if (msg.role === 'user') return `User: ${msg.content}`;
        if (msg.role === 'assistant') return `Assistant: ${msg.content}`;
        return msg.content;
      })
      .join('\n\n');
  }
}

// Helper to create provider from settings
export function createLocalProvider(endpoint?: string): LocalProvider {
  return new LocalProvider(endpoint);
}

// LM Studio provider (uses OpenAI-compatible API)
export class LMStudioProvider implements AIProvider {
  private endpoint: string;

  constructor(endpoint: string = 'http://localhost:1234') {
    this.endpoint = endpoint.replace(/\/$/, '');
  }

  isConfigured(): boolean {
    return true;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.endpoint}/v1/models`);
      if (!response.ok) {
        return { success: false, error: `Server returned ${response.status}` };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Connection failed' };
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.endpoint}/v1/models`);
      if (!response.ok) throw new Error('Failed to fetch models');
      
      const data = await response.json();
      return data.data?.map((m: any) => m.id) || [];
    } catch (error) {
      console.error('Failed to list LM Studio models:', error);
      return [];
    }
  }

  async complete(
    messages: Array<{ role: string; content: string }>,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      jsonMode?: boolean;
    } = {}
  ): Promise<{
    content: string;
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  }> {
    const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || 'local-model',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }

  async generateEmbedding(text: string): Promise<{
    embedding: number[];
    usage: { tokens: number };
  }> {
    throw new Error('LM Studio embedding support not implemented');
  }

  async generateEmbeddings(texts: string[]): Promise<{
    embeddings: number[][];
    usage: { tokens: number };
  }> {
    throw new Error('LM Studio embedding support not implemented');
  }
}
