/**
 * Document Analysis
 * AI-powered document analysis functionality
 */

import { createOpenAIProvider } from './providers/openai';
import { createAnthropicProvider } from './providers/anthropic';
import { createLocalProvider } from './providers/local';
import { AIProvider, AISettings, DocumentAnalysis } from './types';
import { db } from '@/lib/api/db';

export type AnalysisType = 'summary' | 'facts' | 'entities' | 'sentiment' | 'action_items';

export interface AnalysisResult {
  type: AnalysisType;
  data: any;
  confidence?: number;
}

const ANALYSIS_PROMPTS: Record<AnalysisType, string> = {
  summary: `Analyze the following legal document and provide:
1. A concise TL;DR (2-3 sentences)
2. Key points (5-7 bullet points)
3. Main parties involved
4. Important dates mentioned

Return your response in JSON format:
{
  "tldr": "...",
  "keyPoints": ["...", "..."],
  "parties": ["...", "..."],
  "dates": ["..."]
}`,

  facts: `Extract key facts from the following legal document:
- Dates (with context)
- Monetary amounts (with context)
- Parties/entities mentioned
- Locations
- Legal references

Return your response in JSON format:
{
  "dates": [{"date": "...", "context": "..."}],
  "amounts": [{"amount": "...", "context": "..."}],
  "parties": ["..."],
  "locations": ["..."],
  "legalReferences": ["..."]
}`,

  entities: `Extract entities from the following legal document:
- People (names, roles)
- Organizations (companies, law firms, government agencies)
- Legal terms and concepts
- Document types mentioned

Return your response in JSON format:
{
  "people": [{"name": "...", "role": "..."}],
  "organizations": [{"name": "...", "type": "..."}],
  "legalTerms": ["..."],
  "documentTypes": ["..."]
}`,

  sentiment: `Analyze the sentiment and tone of the following legal document:
- Overall sentiment (positive/negative/neutral)
- Tone (formal/informal/aggressive/conciliatory)
- Key concerns or issues raised
- Urgency level

Return your response in JSON format:
{
  "sentiment": "...",
  "tone": "...",
  "concerns": ["..."],
  "urgencyLevel": "high|medium|low"
}`,

  action_items: `Identify action items and next steps from the following legal document:
- Required actions (with deadlines if mentioned)
- Recommended actions
- Warnings or important notices
- Follow-up required

Return your response in JSON format:
{
  "requiredActions": [{"action": "...", "deadline": "...", "priority": "high|medium|low"}],
  "recommendedActions": ["..."],
  "warnings": ["..."],
  "followUp": ["..."]
}`,
};

export async function analyzeDocument(
  documentId: string,
  documentText: string,
  analysisType: AnalysisType,
  settings: AISettings,
  userId: string
): Promise<DocumentAnalysis> {
  const startTime = Date.now();

  try {
    // Get AI provider
    const provider = getProvider(settings);

    // Build prompt
    const systemPrompt = ANALYSIS_PROMPTS[analysisType];
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Document:\n\n${documentText}` },
    ];

    // Generate completion
    const response = await provider.complete(messages, {
      model: settings.defaultModel,
      temperature: 0.3, // Lower temperature for factual analysis
      maxTokens: settings.maxTokens,
      jsonMode: true,
    });

    const processingTime = Date.now() - startTime;

    // Parse result
    let result: any;
    try {
      result = JSON.parse(response.content);
    } catch (e) {
      // If JSON parsing fails, wrap content in generic structure
      result = { content: response.content };
    }

    // Calculate cost
    const cost = calculateCost(
      settings.defaultProvider,
      settings.defaultModel,
      response.usage.inputTokens,
      response.usage.outputTokens
    );

    // Save to database
    const analysis = await db.query<DocumentAnalysis>(
      `INSERT INTO document_analyses (
        document_id, analysis_type, prompt, result, model, provider, 
        tokens_used, processing_time_ms, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        documentId,
        analysisType,
        systemPrompt,
        JSON.stringify(result),
        settings.defaultModel,
        settings.defaultProvider,
        response.usage.totalTokens,
        processingTime,
        userId,
      ]
    ).then(res => res.rows[0]);

    // Track usage
    await trackUsage({
      userId,
      organizationId: settings.organizationId,
      provider: settings.defaultProvider,
      model: settings.defaultModel,
      feature: 'document_analysis',
      tokensUsed: response.usage.totalTokens,
      costUsd: cost,
      success: true,
    });

    return analysis;
  } catch (error: any) {
    const processingTime = Date.now() - startTime;

    // Save error to database
    const analysis = await db.query<DocumentAnalysis>(
      `INSERT INTO document_analyses (
        document_id, analysis_type, prompt, result, model, provider,
        tokens_used, processing_time_ms, error, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        documentId,
        analysisType,
        ANALYSIS_PROMPTS[analysisType],
        JSON.stringify({ error: error.message }),
        settings.defaultModel,
        settings.defaultProvider,
        0,
        processingTime,
        error.message,
        userId,
      ]
    ).then(res => res.rows[0]);

    // Track failed usage
    await trackUsage({
      userId,
      organizationId: settings.organizationId,
      provider: settings.defaultProvider,
      model: settings.defaultModel,
      feature: 'document_analysis',
      tokensUsed: 0,
      costUsd: 0,
      success: false,
      errorMessage: error.message,
    });

    throw error;
  }
}

export async function batchAnalyzeDocuments(
  documents: Array<{ id: string; text: string }>,
  analysisType: AnalysisType,
  settings: AISettings,
  userId: string,
  onProgress?: (current: number, total: number) => void
): Promise<DocumentAnalysis[]> {
  const results: DocumentAnalysis[] = [];

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    
    try {
      const analysis = await analyzeDocument(
        doc.id,
        doc.text,
        analysisType,
        settings,
        userId
      );
      results.push(analysis);
    } catch (error) {
      console.error(`Failed to analyze document ${doc.id}:`, error);
    }

    if (onProgress) {
      onProgress(i + 1, documents.length);
    }
  }

  return results;
}

function getProvider(settings: AISettings): AIProvider {
  switch (settings.defaultProvider) {
    case 'openai':
      return createOpenAIProvider(settings.openaiApiKey || undefined);
    case 'anthropic':
      return createAnthropicProvider(settings.anthropicApiKey || undefined);
    case 'local':
      return createLocalProvider(settings.localEndpoint);
    default:
      throw new Error(`Unknown provider: ${settings.defaultProvider}`);
  }
}

function calculateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Cost calculation based on provider and model
  // This is a simplified version - you should use the config.ts values
  if (provider === 'local') return 0;

  const costs: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  };

  const modelCost = costs[model] || { input: 0, output: 0 };
  const inputCost = (inputTokens / 1000) * modelCost.input;
  const outputCost = (outputTokens / 1000) * modelCost.output;

  return inputCost + outputCost;
}

async function trackUsage(usage: {
  userId: string;
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
      user_id, organization_id, provider, model, feature,
      tokens_used, cost_usd, success, error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      usage.userId,
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
