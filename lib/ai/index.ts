/**
 * AI Module - Main Export
 * Central export point for all AI functionality
 */

// Providers
export { createOpenAIProvider, OpenAIProvider } from './providers/openai';
export { createAnthropicProvider, AnthropicProvider } from './providers/anthropic';
export { createLocalProvider, LocalProvider, LMStudioProvider } from './providers/local';

// Core functionality
export {
  analyzeDocument,
  batchAnalyzeDocuments,
  type AnalysisType,
  type AnalysisResult,
} from './document-analysis';

export {
  generateCaseInsights,
  findSimilarCases,
  assessCaseRisks,
  type CaseData,
} from './case-insights';

export {
  generateEmbedding,
  generateEmbeddings,
  updateDocumentEmbedding,
  updateCaseEmbedding,
  batchUpdateDocumentEmbeddings,
  batchUpdateCaseEmbeddings,
  getCaseEmbeddingText,
  getDocumentEmbeddingText,
  type EmbeddingResult,
} from './embeddings';

export {
  semanticSearch,
  hybridSearch,
  suggestSearchQueries,
  getSearchHistory,
  type SemanticSearchOptions,
  type SemanticSearchResult,
} from './vector-search';

// Configuration
export {
  AI_MODELS,
  EMBEDDING_MODELS,
  DEFAULT_AI_CONFIG,
  ANALYSIS_TYPES,
  RISK_LEVELS,
  getModelsByProvider,
  getEmbeddingModelsByProvider,
  calculateCost,
  calculateEmbeddingCost,
  type AIProvider as AIProviderType,
  type EmbeddingProvider,
  type AIModelConfig,
  type EmbeddingModelConfig,
  type AnalysisType as ConfigAnalysisType,
  type RiskLevel,
  type ModelAvailability,
} from './config';

// Types
export type {
  AIProvider,
  AISettings,
  DocumentAnalysis,
  CaseInsight,
  AIUsage,
  ChatConversation,
  ChatMessage,
  SearchQuery,
  SearchResult,
  SimilarCase,
} from './types';
