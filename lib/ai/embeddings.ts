/**
 * Embeddings
 * Generate and manage vector embeddings for semantic search
 */

import { createOpenAIProvider } from './providers/openai';
import { createLocalProvider } from './providers/local';
import { AISettings } from './types';
import { db } from '@/lib/api/db';

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  cost: number;
}

export async function generateEmbedding(
  text: string,
  settings: AISettings
): Promise<EmbeddingResult> {
  const provider = getEmbeddingProvider(settings);
  const model = settings.embeddingModel;

  const result = await provider.generateEmbedding!(text, model);

  // Calculate cost (only for cloud providers)
  const cost = settings.embeddingProvider === 'openai' 
    ? calculateEmbeddingCost(model, result.usage.tokens)
    : 0;

  // Track usage
  await trackUsage({
    organizationId: settings.organizationId,
    provider: settings.embeddingProvider,
    model,
    feature: 'embedding_generation',
    tokensUsed: result.usage.tokens,
    costUsd: cost,
    success: true,
  });

  return {
    embedding: result.embedding,
    tokens: result.usage.tokens,
    cost,
  };
}

export async function generateEmbeddings(
  texts: string[],
  settings: AISettings
): Promise<Array<EmbeddingResult>> {
  const provider = getEmbeddingProvider(settings);
  const model = settings.embeddingModel;

  const result = await provider.generateEmbeddings!(texts, model);

  const tokensPerEmbedding = Math.ceil(result.usage.tokens / texts.length);
  const costPerEmbedding = settings.embeddingProvider === 'openai'
    ? calculateEmbeddingCost(model, tokensPerEmbedding)
    : 0;

  // Track usage
  await trackUsage({
    organizationId: settings.organizationId,
    provider: settings.embeddingProvider,
    model,
    feature: 'embedding_generation',
    tokensUsed: result.usage.tokens,
    costUsd: costPerEmbedding * texts.length,
    success: true,
  });

  return result.embeddings.map(embedding => ({
    embedding,
    tokens: tokensPerEmbedding,
    cost: costPerEmbedding,
  }));
}

export async function updateDocumentEmbedding(
  documentId: string,
  text: string,
  settings: AISettings
): Promise<void> {
  try {
    const { embedding } = await generateEmbedding(text, settings);

    await db.query(
      `UPDATE documents 
       SET embedding = $1, 
           embedding_model = $2,
           embedding_updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(embedding), settings.embeddingModel, documentId]
    );
  } catch (error) {
    console.error(`Failed to update embedding for document ${documentId}:`, error);
    throw error;
  }
}

export async function updateCaseEmbedding(
  caseId: string,
  text: string,
  settings: AISettings
): Promise<void> {
  try {
    const { embedding } = await generateEmbedding(text, settings);

    await db.query(
      `UPDATE matters 
       SET embedding = $1,
           embedding_model = $2,
           embedding_updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(embedding), settings.embeddingModel, caseId]
    );
  } catch (error) {
    console.error(`Failed to update embedding for case ${caseId}:`, error);
    throw error;
  }
}

export async function batchUpdateDocumentEmbeddings(
  documents: Array<{ id: string; text: string }>,
  settings: AISettings,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    
    try {
      await updateDocumentEmbedding(doc.id, doc.text, settings);
    } catch (error) {
      console.error(`Failed to update embedding for document ${doc.id}:`, error);
    }

    if (onProgress) {
      onProgress(i + 1, documents.length);
    }

    // Add small delay to avoid rate limiting
    if (settings.embeddingProvider === 'openai') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

export async function batchUpdateCaseEmbeddings(
  cases: Array<{ id: string; text: string }>,
  settings: AISettings,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < cases.length; i++) {
    const caseData = cases[i];
    
    try {
      await updateCaseEmbedding(caseData.id, caseData.text, settings);
    } catch (error) {
      console.error(`Failed to update embedding for case ${caseData.id}:`, error);
    }

    if (onProgress) {
      onProgress(i + 1, cases.length);
    }

    // Add small delay to avoid rate limiting
    if (settings.embeddingProvider === 'openai') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

function getEmbeddingProvider(settings: AISettings) {
  switch (settings.embeddingProvider) {
    case 'openai':
      if (!settings.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }
      return createOpenAIProvider(settings.openaiApiKey);
    
    case 'ollama':
    case 'local':
      return createLocalProvider(settings.localEndpoint);
    
    default:
      throw new Error(`Unknown embedding provider: ${settings.embeddingProvider}`);
  }
}

function calculateEmbeddingCost(model: string, tokens: number): number {
  const costs: Record<string, number> = {
    'text-embedding-3-small': 0.00002,
    'text-embedding-3-large': 0.00013,
  };

  const costPer1k = costs[model] || 0;
  return (tokens / 1000) * costPer1k;
}

async function trackUsage(usage: {
  organizationId: string;
  provider: string;
  model: string;
  feature: string;
  tokensUsed: number;
  costUsd: number;
  success: boolean;
  errorMessage?: string;
}): Promise<void> {
  await db.query(
    `INSERT INTO ai_usage (
      organization_id, provider, model, feature,
      tokens_used, cost_usd, success, error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      usage.organizationId,
      usage.provider,
      usage.model,
      usage.feature,
      usage.tokensUsed,
      usage.costUsd,
      usage.success,
      usage.errorMessage || null,
    ]
  );
}

// Helper: Generate embedding text from case data
export function getCaseEmbeddingText(caseData: {
  title: string;
  description?: string;
  practiceArea?: string;
}): string {
  return `${caseData.title} ${caseData.description || ''} ${caseData.practiceArea || ''}`.trim();
}

// Helper: Generate embedding text from document data
export function getDocumentEmbeddingText(documentData: {
  title: string;
  content?: string;
  excerpt?: string;
}): string {
  return `${documentData.title} ${documentData.excerpt || documentData.content || ''}`.trim();
}
