/**
 * AI Settings API
 * Manage AI provider configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/api/db';
import { requireUser } from '@/lib/auth';
import { createOpenAIProvider } from '@/lib/ai/providers/openai';
import { createAnthropicProvider } from '@/lib/ai/providers/anthropic';
import { createLocalProvider } from '@/lib/ai/providers/local';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get AI settings for organization
    const result = await db.query(
      `SELECT * FROM ai_settings 
       WHERE organization_id = $1 AND user_id IS NULL
       LIMIT 1`,
      [user.id]
    );

    if (result.rows.length === 0) {
      // Return default settings
      return NextResponse.json({
        defaultProvider: 'openai',
        defaultModel: 'gpt-3.5-turbo',
        embeddingProvider: 'openai',
        embeddingModel: 'text-embedding-3-small',
        localEndpoint: 'http://localhost:11434',
        maxTokens: 4096,
        temperature: 0.7,
        enableSemanticSearch: false,
        enableDocumentAnalysis: true,
        enableCaseInsights: true,
        enableChatAssistant: false,
      });
    }

    const settings = result.rows[0];

    // Don't send API keys to client
    return NextResponse.json({
      ...settings,
      openaiApiKey: settings.openai_api_key ? '***' : null,
      anthropicApiKey: settings.anthropic_api_key ? '***' : null,
    });
  } catch (error: any) {
    console.error('Failed to get AI settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get AI settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      defaultProvider,
      defaultModel,
      openaiApiKey,
      anthropicApiKey,
      localEndpoint,
      embeddingProvider,
      embeddingModel,
      maxTokens,
      temperature,
      enableSemanticSearch,
      enableDocumentAnalysis,
      enableCaseInsights,
      enableChatAssistant,
    } = body;

    // Upsert settings
    const result = await db.query(
      `INSERT INTO ai_settings (
        organization_id, default_provider, default_model,
        openai_api_key, anthropic_api_key, local_endpoint,
        embedding_provider, embedding_model,
        max_tokens, temperature,
        enable_semantic_search, enable_document_analysis,
        enable_case_insights, enable_chat_assistant
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (organization_id, user_id)
      DO UPDATE SET
        default_provider = EXCLUDED.default_provider,
        default_model = EXCLUDED.default_model,
        openai_api_key = COALESCE(EXCLUDED.openai_api_key, ai_settings.openai_api_key),
        anthropic_api_key = COALESCE(EXCLUDED.anthropic_api_key, ai_settings.anthropic_api_key),
        local_endpoint = EXCLUDED.local_endpoint,
        embedding_provider = EXCLUDED.embedding_provider,
        embedding_model = EXCLUDED.embedding_model,
        max_tokens = EXCLUDED.max_tokens,
        temperature = EXCLUDED.temperature,
        enable_semantic_search = EXCLUDED.enable_semantic_search,
        enable_document_analysis = EXCLUDED.enable_document_analysis,
        enable_case_insights = EXCLUDED.enable_case_insights,
        enable_chat_assistant = EXCLUDED.enable_chat_assistant,
        updated_at = NOW()
      RETURNING *`,
      [
        user.id,
        defaultProvider,
        defaultModel,
        openaiApiKey || null,
        anthropicApiKey || null,
        localEndpoint || 'http://localhost:11434',
        embeddingProvider,
        embeddingModel,
        maxTokens || 4096,
        temperature || 0.7,
        enableSemanticSearch || false,
        enableDocumentAnalysis || true,
        enableCaseInsights || true,
        enableChatAssistant || false,
      ]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Failed to save AI settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save AI settings' },
      { status: 500 }
    );
  }
}

// Test connection endpoint
export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey, endpoint } = body;

    let testResult: { success: boolean; error?: string };

    switch (provider) {
      case 'openai':
        const openaiProvider = createOpenAIProvider(apiKey);
        testResult = await openaiProvider.testConnection();
        break;

      case 'anthropic':
        const anthropicProvider = createAnthropicProvider(apiKey);
        testResult = await anthropicProvider.testConnection();
        break;

      case 'local':
        const localProvider = createLocalProvider(endpoint);
        testResult = await localProvider.testConnection();
        
        // Also fetch available models
        if (testResult.success) {
          const models = await localProvider.listModels();
          return NextResponse.json({
            success: true,
            models,
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown provider' },
          { status: 400 }
        );
    }

    return NextResponse.json(testResult);
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Connection test failed',
    });
  }
}
