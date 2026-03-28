/**
 * Case Insights
 * AI-powered case/matter insights and analysis
 */

import { createOpenAIProvider } from './providers/openai';
import { createAnthropicProvider } from './providers/anthropic';
import { createLocalProvider } from './providers/local';
import { AIProvider, AISettings, CaseInsight, SimilarCase } from './types';
import { db } from '@/lib/api/db';

export interface CaseData {
  id: string;
  title: string;
  matterNumber: string;
  description: string;
  status: string;
  practiceArea: string;
  documents?: Array<{ title: string; excerpt: string }>;
  timeline?: Array<{ date: string; event: string }>;
}

export async function generateCaseInsights(
  caseData: CaseData,
  settings: AISettings,
  userId: string
): Promise<CaseInsight> {
  const startTime = Date.now();

  try {
    const provider = getProvider(settings);

    // Build comprehensive prompt
    const systemPrompt = `You are a legal AI assistant analyzing a case/matter. Provide a comprehensive analysis including:
1. Executive summary (2-3 paragraphs)
2. Risk assessment (high/medium/low) with specific risk factors
3. Key events timeline
4. Recommended actions
5. Estimated outcome probabilities

Return your response in JSON format:
{
  "summary": "...",
  "riskLevel": "high|medium|low",
  "riskFactors": [{"factor": "...", "severity": "high|medium|low", "mitigation": "..."}],
  "keyEvents": [{"date": "...", "event": "...", "significance": "..."}],
  "recommendations": ["...", "..."],
  "outcomeProbability": {"favorable": 0.6, "unfavorable": 0.3, "uncertain": 0.1}
}`;

    const caseContext = `
Case Information:
- Title: ${caseData.title}
- Matter Number: ${caseData.matterNumber}
- Status: ${caseData.status}
- Practice Area: ${caseData.practiceArea}
- Description: ${caseData.description}

${caseData.documents && caseData.documents.length > 0 ? `
Documents:
${caseData.documents.map(doc => `- ${doc.title}: ${doc.excerpt}`).join('\n')}
` : ''}

${caseData.timeline && caseData.timeline.length > 0 ? `
Timeline:
${caseData.timeline.map(t => `- ${t.date}: ${t.event}`).join('\n')}
` : ''}
`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: caseContext },
    ];

    const response = await provider.complete(messages, {
      model: settings.defaultModel,
      temperature: 0.4,
      maxTokens: settings.maxTokens,
      jsonMode: true,
    });

    const processingTime = Date.now() - startTime;

    // Parse result
    let result: any;
    try {
      result = JSON.parse(response.content);
    } catch (e) {
      throw new Error('Failed to parse AI response');
    }

    // Calculate cost
    const cost = calculateCost(
      settings.defaultProvider,
      settings.defaultModel,
      response.usage.inputTokens,
      response.usage.outputTokens
    );

    // Save to database
    const insight = await db.query<CaseInsight>(
      `INSERT INTO case_insights (
        case_id, summary, risk_level, risk_factors, similar_cases,
        recommendations, key_events, outcome_probability,
        model, provider, tokens_used, processing_time_ms, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        caseData.id,
        result.summary,
        result.riskLevel,
        JSON.stringify(result.riskFactors),
        JSON.stringify([]), // Similar cases added separately
        result.recommendations,
        JSON.stringify(result.keyEvents),
        JSON.stringify(result.outcomeProbability),
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
      feature: 'case_insights',
      tokensUsed: response.usage.totalTokens,
      costUsd: cost,
      success: true,
    });

    return insight;
  } catch (error: any) {
    const processingTime = Date.now() - startTime;

    console.error('Case insights generation failed:', error);

    // Track failed usage
    await trackUsage({
      userId,
      organizationId: settings.organizationId,
      provider: settings.defaultProvider,
      model: settings.defaultModel,
      feature: 'case_insights',
      tokensUsed: 0,
      costUsd: 0,
      success: false,
      errorMessage: error.message,
    });

    throw error;
  }
}

export async function findSimilarCases(
  caseId: string,
  caseEmbedding: number[],
  limit: number = 5,
  threshold: number = 0.7
): Promise<SimilarCase[]> {
  const result = await db.query<SimilarCase>(
    `SELECT * FROM find_similar_cases($1::vector, $2, $3)
     WHERE id != $4`,
    [JSON.stringify(caseEmbedding), limit, threshold, caseId]
  );

  return result.rows;
}

export async function assessCaseRisks(
  caseData: CaseData,
  settings: AISettings
): Promise<{
  riskLevel: 'high' | 'medium' | 'low';
  risks: Array<{ type: string; description: string; mitigation: string }>;
}> {
  const provider = getProvider(settings);

  const prompt = `Analyze the following case for potential risks:

${JSON.stringify(caseData, null, 2)}

Identify risks such as:
- Missing documents
- Statute of limitations issues
- Conflicts of interest
- Compliance issues
- Financial risks

Return JSON:
{
  "riskLevel": "high|medium|low",
  "risks": [{"type": "...", "description": "...", "mitigation": "..."}]
}`;

  const messages = [
    { role: 'system', content: 'You are a legal risk assessment AI.' },
    { role: 'user', content: prompt },
  ];

  const response = await provider.complete(messages, {
    model: settings.defaultModel,
    temperature: 0.3,
    jsonMode: true,
  });

  return JSON.parse(response.content);
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
  return ((inputTokens / 1000) * modelCost.input) + ((outputTokens / 1000) * modelCost.output);
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
