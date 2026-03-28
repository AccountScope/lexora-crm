/**
 * Anthropic Provider
 * Handles Anthropic Claude API integration
 */

import Anthropic from '@anthropic-ai/sdk';
import { AIProvider } from '../types';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
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

      // Test with a minimal message
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'test' }],
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
    // Anthropic doesn't have a models API, return known models
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
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
      throw new Error('Anthropic client not configured');
    }

    // Extract system message if present
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await this.client.messages.create({
      model: options.model || 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      system: systemMessage?.content,
      messages: conversationMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Anthropic');
    }

    return {
      content: textContent.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  async generateEmbedding(text: string): Promise<{
    embedding: number[];
    usage: { tokens: number };
  }> {
    throw new Error('Anthropic does not provide embedding models. Use OpenAI or local embeddings.');
  }

  async generateEmbeddings(texts: string[]): Promise<{
    embeddings: number[][];
    usage: { tokens: number };
  }> {
    throw new Error('Anthropic does not provide embedding models. Use OpenAI or local embeddings.');
  }
}

// Helper to create provider from settings
export function createAnthropicProvider(apiKey?: string): AnthropicProvider {
  return new AnthropicProvider(apiKey);
}
