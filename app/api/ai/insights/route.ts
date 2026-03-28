/**
 * Case Insights API
 * Generate AI-powered case insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/api/db';
import { requireUser } from '@/lib/auth';
import { generateCaseInsights, findSimilarCases, CaseData } from '@/lib/ai/case-insights';
import { AISettings } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { caseId } = body;

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
    }

    // Get AI settings
    const settings = await getAISettings(user.id);
    if (!settings.enableCaseInsights) {
      return NextResponse.json({ error: 'Case insights disabled' }, { status: 403 });
    }

    // Get case data
    const caseResult = await db.query(
      `SELECT m.*, 
        (SELECT json_agg(json_build_object('title', d.title, 'excerpt', LEFT(d.content, 500)))
         FROM documents d WHERE d.matter_id = m.id LIMIT 10) as documents
       FROM matters m
       WHERE m.id = $1 AND m.organization_id = $2`,
      [caseId, user.id]
    );

    if (caseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const caseRow = caseResult.rows[0];
    const caseData: CaseData = {
      id: caseRow.id,
      title: caseRow.title,
      matterNumber: caseRow.matter_number,
      description: caseRow.description || '',
      status: caseRow.status,
      practiceArea: caseRow.practice_area || 'General',
      documents: caseRow.documents || [],
    };

    const insights = await generateCaseInsights(caseData, settings, user.id);

    // Find similar cases if embeddings enabled
    let similarCases: any[] = [];
    if (settings.enableSemanticSearch && caseRow.embedding) {
      similarCases = await findSimilarCases(caseId, caseRow.embedding, 5, 0.7);
    }

    return NextResponse.json({ ...insights, similarCases });
  } catch (error: any) {
    console.error('Case insights failed:', error);
    return NextResponse.json({ error: error.message || 'Insights generation failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
    }

    const result = await db.query(
      `SELECT ci.*, u.full_name as created_by_name
       FROM case_insights ci
       LEFT JOIN users u ON ci.created_by = u.id
       WHERE ci.case_id = $1
       ORDER BY ci.created_at DESC
       LIMIT 1`,
      [caseId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No insights found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Failed to get case insights:', error);
    return NextResponse.json({ error: error.message || 'Failed to get insights' }, { status: 500 });
  }
}

async function getAISettings(organizationId: string): Promise<AISettings> {
  const result = await db.query(
    `SELECT * FROM ai_settings WHERE organization_id = $1 AND user_id IS NULL LIMIT 1`,
    [organizationId]
  );

  if (result.rows.length === 0) {
    return {
      id: '', organizationId, userId: null, defaultProvider: 'openai',
      openaiApiKey: null, anthropicApiKey: null, localEndpoint: 'http://localhost:11434',
      defaultModel: 'gpt-3.5-turbo', embeddingProvider: 'openai',
      embeddingModel: 'text-embedding-3-small', maxTokens: 4096, temperature: 0.7,
      enableSemanticSearch: false, enableDocumentAnalysis: true,
      enableCaseInsights: true, enableChatAssistant: false, settings: {},
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
  }

  const row = result.rows[0];
  return {
    id: row.id, organizationId: row.organization_id, userId: row.user_id,
    defaultProvider: row.default_provider, openaiApiKey: row.openai_api_key,
    anthropicApiKey: row.anthropic_api_key, localEndpoint: row.local_endpoint,
    defaultModel: row.default_model, embeddingProvider: row.embedding_provider,
    embeddingModel: row.embedding_model, maxTokens: row.max_tokens,
    temperature: parseFloat(row.temperature), enableSemanticSearch: row.enable_semantic_search,
    enableDocumentAnalysis: row.enable_document_analysis,
    enableCaseInsights: row.enable_case_insights,
    enableChatAssistant: row.enable_chat_assistant, settings: row.settings || {},
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
