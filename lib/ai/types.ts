/**
 * AI Types
 * Shared types for AI functionality
 */

export interface AIProvider {
  isConfigured(): boolean;
  testConnection(): Promise<{ success: boolean; error?: string }>;
  listModels(): Promise<string[]>;
  complete(
    messages: Array<{ role: string; content: string }>,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      jsonMode?: boolean;
    }
  ): Promise<{
    content: string;
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  }>;
  generateEmbedding?(
    text: string,
    model?: string
  ): Promise<{
    embedding: number[];
    usage: { tokens: number };
  }>;
  generateEmbeddings?(
    texts: string[],
    model?: string
  ): Promise<{
    embeddings: number[][];
    usage: { tokens: number };
  }>;
}

export interface AISettings {
  id: string;
  organizationId: string;
  userId: string | null;
  defaultProvider: 'openai' | 'anthropic' | 'local';
  openaiApiKey: string | null;
  anthropicApiKey: string | null;
  localEndpoint: string;
  defaultModel: string;
  embeddingProvider: 'openai' | 'local' | 'ollama';
  embeddingModel: string;
  maxTokens: number;
  temperature: number;
  enableSemanticSearch: boolean;
  enableDocumentAnalysis: boolean;
  enableCaseInsights: boolean;
  enableChatAssistant: boolean;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAnalysis {
  id: string;
  documentId: string;
  analysisType: 'summary' | 'facts' | 'entities' | 'sentiment' | 'action_items';
  prompt: string;
  result: any;
  model: string;
  provider: 'openai' | 'anthropic' | 'local';
  tokensUsed: number;
  processingTimeMs: number | null;
  confidenceScore: number | null;
  error: string | null;
  createdAt: string;
  createdBy: string;
}

export interface CaseInsight {
  id: string;
  caseId: string;
  summary: string;
  riskLevel: 'high' | 'medium' | 'low' | 'unknown';
  riskFactors: any;
  similarCases: any;
  recommendations: string[];
  keyEvents: any;
  outcomeProbability: any;
  model: string;
  provider: 'openai' | 'anthropic' | 'local';
  tokensUsed: number;
  processingTimeMs: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AIUsage {
  id: string;
  userId: string;
  organizationId: string;
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  feature: string;
  tokensUsed: number;
  costUsd: number;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  userId: string;
  organizationId: string;
  title: string | null;
  context: any;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model: string | null;
  provider: 'openai' | 'anthropic' | 'local' | null;
  tokensUsed: number;
  createdAt: string;
}

export interface SearchQuery {
  query: string;
  type: 'keyword' | 'semantic';
  filters?: {
    caseId?: string;
    documentType?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export interface SearchResult {
  id: string;
  type: 'document' | 'case' | 'note';
  title: string;
  snippet: string;
  relevance: number;
  metadata: any;
}

export interface SimilarCase {
  id: string;
  title: string;
  matterNumber: string;
  status: string;
  similarity: number;
}
