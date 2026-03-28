/**
 * Document Analysis API
 * Analyze documents using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/api/db';
import { requireUser } from '@/lib/auth';
import { analyzeDocument, batchAnalyzeDocuments, AnalysisType } from '@/lib/ai/document-analysis';
import { AISettings } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, documentIds, analysisType, documentText } = body;

    // Validate analysis type
    const validTypes: AnalysisType[] = ['summary', 'facts', 'entities', 'sentiment', 'action_items'];
    if (!validTypes.includes(analysisType)) {
      return NextResponse.json(
        { error: 'Invalid analysis type' },
        { status: 400 }
      );
    }

    // Get AI settings
    const settings = await getAISettings(user.id);
    if (!settings.enableDocumentAnalysis) {
      return NextResponse.json(
        { error: 'Document analysis is disabled' },
        { status: 403 }
      );
    }

    // Batch analysis
    if (documentIds && Array.isArray(documentIds)) {
      // Get documents
      const documentsResult = await db.query(
        `SELECT id, title, content, file_path FROM documents 
         WHERE id = ANY($1) AND organization_id = $2`,
        [documentIds, user.id]
      );

      if (documentsResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'No documents found' },
          { status: 404 }
        );
      }

      // Extract text from documents
      const documents = documentsResult.rows.map(doc => ({
        id: doc.id,
        text: doc.content || `Title: ${doc.title}\nFile: ${doc.file_path}`,
      }));

      // Run batch analysis
      const results = await batchAnalyzeDocuments(
        documents,
        analysisType,
        settings,
        user.id
      );

      return NextResponse.json({
        results,
        totalAnalyzed: results.length,
        totalRequested: documentIds.length,
      });
    }

    // Single document analysis
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get document
    let text = documentText;
    
    if (!text) {
      const docResult = await db.query(
        `SELECT title, content, file_path FROM documents 
         WHERE id = $1 AND organization_id = $2`,
        [documentId, user.id]
      );

      if (docResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      const doc = docResult.rows[0];
      text = doc.content || `Title: ${doc.title}\nFile: ${doc.file_path}`;
    }

    // Run analysis
    const result = await analyzeDocument(
      documentId,
      text,
      analysisType,
      settings,
      user.id
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Document analysis failed:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}

// Get analysis history for a document
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const result = await db.query(
      `SELECT 
        da.*,
        u.full_name as created_by_name
       FROM document_analyses da
       LEFT JOIN users u ON da.created_by = u.id
       WHERE da.document_id = $1
       ORDER BY da.created_at DESC`,
      [documentId]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Failed to get analysis history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get analysis history' },
      { status: 500 }
    );
  }
}

async function getAISettings(organizationId: string): Promise<AISettings> {
  const result = await db.query(
    `SELECT * FROM ai_settings 
     WHERE organization_id = $1 AND user_id IS NULL
     LIMIT 1`,
    [organizationId]
  );

  if (result.rows.length === 0) {
    // Return default settings
    return {
      id: '',
      organizationId,
      userId: null,
      defaultProvider: 'openai',
      openaiApiKey: null,
      anthropicApiKey: null,
      localEndpoint: 'http://localhost:11434',
      defaultModel: 'gpt-3.5-turbo',
      embeddingProvider: 'openai',
      embeddingModel: 'text-embedding-3-small',
      maxTokens: 4096,
      temperature: 0.7,
      enableSemanticSearch: false,
      enableDocumentAnalysis: true,
      enableCaseInsights: true,
      enableChatAssistant: false,
      settings: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const row = result.rows[0];
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    defaultProvider: row.default_provider,
    openaiApiKey: row.openai_api_key,
    anthropicApiKey: row.anthropic_api_key,
    localEndpoint: row.local_endpoint,
    defaultModel: row.default_model,
    embeddingProvider: row.embedding_provider,
    embeddingModel: row.embedding_model,
    maxTokens: row.max_tokens,
    temperature: parseFloat(row.temperature),
    enableSemanticSearch: row.enable_semantic_search,
    enableDocumentAnalysis: row.enable_document_analysis,
    enableCaseInsights: row.enable_case_insights,
    enableChatAssistant: row.enable_chat_assistant,
    settings: row.settings || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
