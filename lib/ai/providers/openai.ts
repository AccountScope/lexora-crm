/**
 * OpenAI Provider
 * Handles OpenAI API integration for chat and embeddings
 */

import OpenAI from 'openai';
import { AIProvider } from '../types';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.client) {
        return { success: false, error: 'API key not configured' };
      }

      // Test with a minimal completion
      await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });

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
      if (!this.client) return [];
      
      const response = await this.client.models.list();
      return response.data
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id);
    } catch (error) {
      console.error('Failed to list OpenAI models:', error);
      return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']; // Fallback to known models
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
    if (!this.client) {
      throw new Error('OpenAI client not configured');
    }

    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-3.5-turbo',
      messages: messages as any,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    });

    const choice = response.choices[0];
    if (!choice || !choice.message.content) {
      throw new Error('No response from OpenAI');
    }

    return {
      content: choice.message.content,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }

  async generateEmbedding(
    text: string,
    model: string = 'text-embedding-3-small'
  ): Promise<{
    embedding: number[];
    usage: { tokens: number };
  }> {
    if (!this.client) {
      throw new Error('OpenAI client not configured');
    }

    const response = await this.client.embeddings.create({
      model,
      input: text,
      encoding_format: 'float',
    });

    return {
      embedding: response.data[0].embedding,
      usage: {
        tokens: response.usage.total_tokens,
      },
    };
  }

  async generateEmbeddings(
    texts: string[],
    model: string = 'text-embedding-3-small'
  ): Promise<{
    embeddings: number[][];
    usage: { tokens: number };
  }> {
    if (!this.client) {
      throw new Error('OpenAI client not configured');
    }

    const response = await this.client.embeddings.create({
      model,
      input: texts,
      encoding_format: 'float',
    });

    return {
      embeddings: response.data.map(item => item.embedding),
      usage: {
        tokens: response.usage.total_tokens,
      },
    };
  }
}

// Helper to create provider from settings
export function createOpenAIProvider(apiKey?: string): OpenAIProvider {
  return new OpenAIProvider(apiKey);
}
