/**
 * Semantic Search API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { semanticSearch, hybridSearch, getSearchHistory } from '@/lib/ai/vector-search';
import { db } from '@/lib/api/db';
import { AISettings } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, type, limit, threshold, searchMode } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const settings = await getAISettings(user.id);
    
    if (!settings.enableSemanticSearch && searchMode === 'semantic') {
      return NextResponse.json({ error: 'Semantic search is disabled' }, { status: 403 });
    }

    const searchOptions = { query, type, limit: limit || 10, threshold: threshold || 0.7 };

    const results = searchMode === 'hybrid'
      ? await hybridSearch(searchOptions, settings, user.id)
      : await semanticSearch(searchOptions, settings, user.id);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Search failed:', error);
    return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const history = await getSearchHistory(user.id, 20);
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
