/**
 * AI Configuration
 * Centralized configuration for AI providers and models
 */

export type AIProvider = 'openai' | 'anthropic' | 'local';
export type EmbeddingProvider = 'openai' | 'local' | 'ollama';

export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  costPer1kTokens: {
    input: number;
    output: number;
  };
  supportsVision?: boolean;
  supportsJSON?: boolean;
}

export interface EmbeddingModelConfig {
  id: string;
  name: string;
  provider: EmbeddingProvider;
  dimensions: number;
  costPer1kTokens?: number;
}

// Available AI Models
export const AI_MODELS: Record<string, AIModelConfig> = {
  // OpenAI Models
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    contextWindow: 8192,
    costPer1kTokens: { input: 0.03, output: 0.06 },
    supportsVision: false,
    supportsJSON: true,
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    contextWindow: 128000,
    costPer1kTokens: { input: 0.01, output: 0.03 },
    supportsVision: true,
    supportsJSON: true,
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    contextWindow: 16385,
    costPer1kTokens: { input: 0.0005, output: 0.0015 },
    supportsVision: false,
    supportsJSON: true,
  },
  
  // Anthropic Models
  'claude-3.5-sonnet': {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    supportsVision: true,
    supportsJSON: true,
  },
  'claude-3-opus': {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    contextWindow: 200000,
    costPer1kTokens: { input: 0.015, output: 0.075 },
    supportsVision: true,
    supportsJSON: true,
  },
  'claude-3-haiku': {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    costPer1kTokens: { input: 0.00025, output: 0.00125 },
    supportsVision: true,
    supportsJSON: true,
  },
  
  // Local Models (Ollama)
  'llama-3.1-70b': {
    id: 'llama3.1:70b',
    name: 'Llama 3.1 70B',
    provider: 'local',
    contextWindow: 128000,
    costPer1kTokens: { input: 0, output: 0 },
    supportsVision: false,
    supportsJSON: true,
  },
  'llama-3.1-8b': {
    id: 'llama3.1:8b',
    name: 'Llama 3.1 8B',
    provider: 'local',
    contextWindow: 128000,
    costPer1kTokens: { input: 0, output: 0 },
    supportsVision: false,
    supportsJSON: true,
  },
  'mistral': {
    id: 'mistral:latest',
    name: 'Mistral',
    provider: 'local',
    contextWindow: 32000,
    costPer1kTokens: { input: 0, output: 0 },
    supportsVision: false,
    supportsJSON: true,
  },
  'phi3': {
    id: 'phi3:latest',
    name: 'Phi-3',
    provider: 'local',
    contextWindow: 128000,
    costPer1kTokens: { input: 0, output: 0 },
    supportsVision: false,
    supportsJSON: true,
  },
};

// Embedding Models
export const EMBEDDING_MODELS: Record<string, EmbeddingModelConfig> = {
  // OpenAI Embeddings
  'text-embedding-3-small': {
    id: 'text-embedding-3-small',
    name: 'OpenAI Embedding (Small)',
    provider: 'openai',
    dimensions: 384,
    costPer1kTokens: 0.00002,
  },
  'text-embedding-3-large': {
    id: 'text-embedding-3-large',
    name: 'OpenAI Embedding (Large)',
    provider: 'openai',
    dimensions: 3072,
    costPer1kTokens: 0.00013,
  },
  
  // Local Embeddings (Ollama)
  'nomic-embed-text': {
    id: 'nomic-embed-text',
    name: 'Nomic Embed Text',
    provider: 'ollama',
    dimensions: 768,
    costPer1kTokens: 0,
  },
  'mxbai-embed-large': {
    id: 'mxbai-embed-large',
    name: 'MxBai Embed Large',
    provider: 'ollama',
    dimensions: 1024,
    costPer1kTokens: 0,
  },
  
  // Local Embeddings (sentence-transformers)
  'all-minilm-l6-v2': {
    id: 'all-MiniLM-L6-v2',
    name: 'All MiniLM L6 v2 (Local)',
    provider: 'local',
    dimensions: 384,
    costPer1kTokens: 0,
  },
};

// Default configurations
export const DEFAULT_AI_CONFIG = {
  provider: 'openai' as AIProvider,
  model: 'gpt-3.5-turbo',
  embeddingProvider: 'openai' as EmbeddingProvider,
  embeddingModel: 'text-embedding-3-small',
  localEndpoint: 'http://localhost:11434',
  maxTokens: 4096,
  temperature: 0.7,
};

// Analysis types
export const ANALYSIS_TYPES = {
  summary: 'Summary',
  facts: 'Extract Facts',
  entities: 'Extract Entities',
  sentiment: 'Sentiment Analysis',
  action_items: 'Action Items',
} as const;

export type AnalysisType = keyof typeof ANALYSIS_TYPES;

// Risk levels
export const RISK_LEVELS = {
  high: { label: 'High', color: 'red' },
  medium: { label: 'Medium', color: 'yellow' },
  low: { label: 'Low', color: 'green' },
  unknown: { label: 'Unknown', color: 'gray' },
} as const;

export type RiskLevel = keyof typeof RISK_LEVELS;

// Helper functions
export function getModelsByProvider(provider: AIProvider): AIModelConfig[] {
  return Object.values(AI_MODELS).filter(model => model.provider === provider);
}

export function getEmbeddingModelsByProvider(provider: EmbeddingProvider): EmbeddingModelConfig[] {
  return Object.values(EMBEDDING_MODELS).filter(model => model.provider === provider);
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const modelConfig = AI_MODELS[model];
  if (!modelConfig) return 0;
  
  const inputCost = (inputTokens / 1000) * modelConfig.costPer1kTokens.input;
  const outputCost = (outputTokens / 1000) * modelConfig.costPer1kTokens.output;
  
  return inputCost + outputCost;
}

export function calculateEmbeddingCost(
  model: string,
  tokens: number
): number {
  const modelConfig = EMBEDDING_MODELS[model];
  if (!modelConfig || !modelConfig.costPer1kTokens) return 0;
  
  return (tokens / 1000) * modelConfig.costPer1kTokens;
}

// Model availability check
export interface ModelAvailability {
  available: boolean;
  models: string[];
  error?: string;
}
