/**
 * Vector Search
 * Semantic search using pgvector
 */

import { db } from '@/lib/api/db';
import { generateEmbedding } from './embeddings';
import { AISettings, SearchResult } from './types';

export interface SemanticSearchOptions {
  query: string;
  type?: 'all' | 'documents' | 'cases';
  limit?: number;
  threshold?: number; // Similarity threshold (0-1)
  filters?: {
    caseId?: string;
    documentType?: string;
    status?: string;
  };
}

export interface SemanticSearchResult {
  results: SearchResult[];
  totalResults: number;
  processingTimeMs: number;
}

export async function semanticSearch(
  options: SemanticSearchOptions,
  settings: AISettings,
  userId: string
): Promise<SemanticSearchResult> {
  const startTime = Date.now();

  try {
    // Generate query embedding
    const { embedding } = await generateEmbedding(options.query, settings);

    const limit = options.limit || 10;
    const threshold = options.threshold || 0.7;
    const type = options.type || 'all';

    let results: SearchResult[] = [];

    // Search documents
    if (type === 'all' || type === 'documents') {
      const documentResults = await searchDocuments(
        embedding,
        limit,
        threshold,
        options.filters
      );
      results = [...results, ...documentResults];
    }

    // Search cases
    if (type === 'all' || type === 'cases') {
      const caseResults = await searchCases(
        embedding,
        limit,
        threshold,
        options.filters
      );
      results = [...results, ...caseResults];
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    // Limit total results
    if (results.length > limit) {
      results = results.slice(0, limit);
    }

    const processingTime = Date.now() - startTime;

    // Track search
    await trackSearch({
      userId,
      organizationId: settings.organizationId,
      query: options.query,
      searchType: 'semantic',
      resultsCount: results.length,
      filters: options.filters,
    });

    return {
      results,
      totalResults: results.length,
      processingTimeMs: processingTime,
    };
  } catch (error) {
    console.error('Semantic search failed:', error);
    throw error;
  }
}

async function searchDocuments(
  embedding: number[],
  limit: number,
  threshold: number,
  filters?: SemanticSearchOptions['filters']
): Promise<SearchResult[]> {
  let query = `
    SELECT 
      id,
      title,
      file_path,
      LEFT(content, 200) as snippet,
      ROUND((1 - (embedding <=> $1::vector))::DECIMAL, 4) as similarity
    FROM documents
    WHERE embedding IS NOT NULL
      AND (1 - (embedding <=> $1::vector)) >= $2
  `;

  const params: any[] = [JSON.stringify(embedding), threshold];
  let paramCount = 2;

  if (filters?.caseId) {
    paramCount++;
    query += ` AND matter_id = $${paramCount}`;
    params.push(filters.caseId);
  }

  if (filters?.documentType) {
    paramCount++;
    query += ` AND file_type = $${paramCount}`;
    params.push(filters.documentType);
  }

  query += ` ORDER BY embedding <=> $1::vector LIMIT $${paramCount + 1}`;
  params.push(limit);

  const result = await db.query(query, params);

  return result.rows.map(row => ({
    id: row.id,
    type: 'document' as const,
    title: row.title,
    snippet: row.snippet || '',
    relevance: parseFloat(row.similarity),
    metadata: {
      filePath: row.file_path,
    },
  }));
}

async function searchCases(
  embedding: number[],
  limit: number,
  threshold: number,
  filters?: SemanticSearchOptions['filters']
): Promise<SearchResult[]> {
  let query = `
    SELECT 
      id,
      title,
      matter_number,
      description,
      status,
      ROUND((1 - (embedding <=> $1::vector))::DECIMAL, 4) as similarity
    FROM matters
    WHERE embedding IS NOT NULL
      AND (1 - (embedding <=> $1::vector)) >= $2
  `;

  const params: any[] = [JSON.stringify(embedding), threshold];
  let paramCount = 2;

  if (filters?.status) {
    paramCount++;
    query += ` AND status = $${paramCount}`;
    params.push(filters.status);
  }

  query += ` ORDER BY embedding <=> $1::vector LIMIT $${paramCount + 1}`;
  params.push(limit);

  const result = await db.query(query, params);

  return result.rows.map(row => ({
    id: row.id,
    type: 'case' as const,
    title: row.title,
    snippet: row.description ? row.description.substring(0, 200) : '',
    relevance: parseFloat(row.similarity),
    metadata: {
      matterNumber: row.matter_number,
      status: row.status,
    },
  }));
}

export async function suggestSearchQueries(
  query: string,
  settings: AISettings
): Promise<string[]> {
  // Get recent searches
  const recentSearches = await db.query(
    `SELECT DISTINCT query 
     FROM search_history 
     WHERE query ILIKE $1
     ORDER BY created_at DESC
     LIMIT 5`,
    [`%${query}%`]
  );

  return recentSearches.rows.map(row => row.query);
}

export async function getSearchHistory(
  userId: string,
  limit: number = 10
): Promise<Array<{ query: string; createdAt: string }>> {
  const result = await db.query(
    `SELECT query, created_at
     FROM search_history
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows.map(row => ({
    query: row.query,
    createdAt: row.created_at,
  }));
}

async function trackSearch(data: {
  userId: string;
  organizationId: string;
  query: string;
  searchType: 'keyword' | 'semantic';
  resultsCount: number;
  filters?: any;
}): Promise<void> {
  await db.query(
    `INSERT INTO search_history (
      user_id, organization_id, query, search_type, results_count, filters
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      data.userId,
      data.organizationId,
      data.query,
      data.searchType,
      data.resultsCount,
      JSON.stringify(data.filters || {}),
    ]
  );
}

// Hybrid search: combines keyword and semantic search
export async function hybridSearch(
  options: SemanticSearchOptions,
  settings: AISettings,
  userId: string
): Promise<SemanticSearchResult> {
  const startTime = Date.now();

  // Run both searches in parallel
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch({ ...options, limit: options.limit || 10 }, settings, userId),
    keywordSearch(options, userId),
  ]);

  // Merge and deduplicate results
  const mergedMap = new Map<string, SearchResult>();

  // Add semantic results with higher weight
  semanticResults.results.forEach(result => {
    mergedMap.set(result.id, {
      ...result,
      relevance: result.relevance * 0.7, // 70% weight for semantic
    });
  });

  // Add keyword results
  keywordResults.results.forEach(result => {
    const existing = mergedMap.get(result.id);
    if (existing) {
      // Boost if found in both
      existing.relevance += result.relevance * 0.3;
    } else {
      mergedMap.set(result.id, {
        ...result,
        relevance: result.relevance * 0.3, // 30% weight for keyword
      });
    }
  });

  // Sort by combined relevance
  const results = Array.from(mergedMap.values())
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, options.limit || 10);

  return {
    results,
    totalResults: results.length,
    processingTimeMs: Date.now() - startTime,
  };
}

async function keywordSearch(
  options: SemanticSearchOptions,
  userId: string
): Promise<SemanticSearchResult> {
  // Simple keyword search using PostgreSQL full-text search
  const query = `
    SELECT 
      id, 
      title,
      ts_rank(to_tsvector('english', title || ' ' || COALESCE(description, '')), plainto_tsquery('english', $1)) as relevance
    FROM matters
    WHERE to_tsvector('english', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', $1)
    ORDER BY relevance DESC
    LIMIT $2
  `;

  const result = await db.query(query, [options.query, options.limit || 10]);

  return {
    results: result.rows.map(row => ({
      id: row.id,
      type: 'case' as const,
      title: row.title,
      snippet: '',
      relevance: parseFloat(row.relevance),
      metadata: {},
    })),
    totalResults: result.rows.length,
    processingTimeMs: 0,
  };
}
