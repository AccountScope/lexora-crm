/**
 * AI Chat Assistant API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/api/db';
import { createOpenAIProvider } from '@/lib/ai/providers/openai';
import { createAnthropicProvider } from '@/lib/ai/providers/anthropic';
import { createLocalProvider } from '@/lib/ai/providers/local';
import { AISettings, AIProvider } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, message, context } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const settings = await getAISettings(user.id);
    if (!settings.enableChatAssistant) {
      return NextResponse.json({ error: 'Chat assistant is disabled' }, { status: 403 });
    }

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const convResult = await db.query(
        `INSERT INTO chat_conversations (user_id, organization_id, context)
         VALUES ($1, $2, $3) RETURNING id`,
        [user.id, user.id, JSON.stringify(context || {})]
      );
      convId = convResult.rows[0].id;
    }

    // Get conversation history
    const historyResult = await db.query(
      `SELECT role, content FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC
       LIMIT 20`,
      [convId]
    );

    const messages = [
      { role: 'system', content: 'You are a helpful legal AI assistant. Answer questions about cases, documents, and legal matters.' },
      ...historyResult.rows,
      { role: 'user', content: message },
    ];

    // Generate response
    const provider = getProvider(settings);
    const response = await provider.complete(messages, {
      model: settings.defaultModel,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
    });

    // Save messages
    await db.query(
      `INSERT INTO chat_messages (conversation_id, role, content, model, provider, tokens_used)
       VALUES ($1, 'user', $2, $3, $4, 0)`,
      [convId, message, settings.defaultModel, settings.defaultProvider]
    );

    await db.query(
      `INSERT INTO chat_messages (conversation_id, role, content, model, provider, tokens_used)
       VALUES ($1, 'assistant', $2, $3, $4, $5)`,
      [convId, response.content, settings.defaultModel, settings.defaultProvider, response.usage.totalTokens]
    );

    return NextResponse.json({
      conversationId: convId,
      message: response.content,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('Chat failed:', error);
    return NextResponse.json({ error: error.message || 'Chat failed' }, { status: 500 });
  }
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
