import { createClient } from '@/lib/api/db';

export interface ConsentRecord {
  id: string;
  userId?: string;
  consentType: 'privacy_policy' | 'terms_of_service' | 'cookies' | 'marketing';
  version: string;
  accepted: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface PolicyVersion {
  id: string;
  policyType: 'privacy_policy' | 'terms_of_service';
  version: string;
  content: string;
  effectiveDate: string;
  createdAt: string;
}

export interface MarketingPreferences {
  userId: string;
  productUpdates: boolean;
  tipsBestPractices: boolean;
  promotionalOffers: boolean;
  shareUsageData: boolean;
  updatedAt: string;
}

/**
 * Record consent
 */
export async function recordConsent(params: {
  userId?: string;
  consentType: ConsentRecord['consentType'];
  version: string;
  accepted: boolean;
  ipAddress?: string;
  userAgent?: string;
}): Promise<ConsentRecord> {
  const db = createClient();
  
  const result = await db.query(
    `INSERT INTO consent_records (
      user_id, consent_type, version, accepted, ip_address, user_agent
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING 
      id,
      user_id as "userId",
      consent_type as "consentType",
      version,
      accepted,
      ip_address as "ipAddress",
      user_agent as "userAgent",
      created_at as "createdAt"`,
    [
      params.userId || null,
      params.consentType,
      params.version,
      params.accepted,
      params.ipAddress || null,
      params.userAgent || null,
    ]
  );
  
  return result.rows[0];
}

/**
 * Get user's consent records
 */
export async function getUserConsents(userId: string): Promise<ConsentRecord[]> {
  const db = createClient();
  
  const result = await db.query(
    `SELECT 
      id,
      user_id as "userId",
      consent_type as "consentType",
      version,
      accepted,
      created_at as "createdAt"
    FROM consent_records
    WHERE user_id = $1
    ORDER BY created_at DESC`,
    [userId]
  );
  
  return result.rows;
}

/**
 * Check if user has accepted latest policy version
 */
export async function hasAcceptedLatestPolicy(params: {
  userId: string;
  policyType: 'privacy_policy' | 'terms_of_service';
}): Promise<boolean> {
  const db = createClient();
  
  // Get latest policy version
  const policyResult = await db.query(
    `SELECT version
     FROM policy_versions
     WHERE policy_type = $1
     ORDER BY effective_date DESC
     LIMIT 1`,
    [params.policyType]
  );
  
  const latestVersion = policyResult.rows[0]?.version;
  if (!latestVersion) {
    return true; // No policy exists yet
  }
  
  // Check if user has accepted this version
  const consentResult = await db.query(
    `SELECT accepted
     FROM consent_records
     WHERE user_id = $1
     AND consent_type = $2
     AND version = $3
     ORDER BY created_at DESC
     LIMIT 1`,
    [params.userId, params.policyType, latestVersion]
  );
  
  return consentResult.rows[0]?.accepted || false;
}

/**
 * Get latest policy version
 */
export async function getLatestPolicy(policyType: 'privacy_policy' | 'terms_of_service'): Promise<PolicyVersion | null> {
  const db = createClient();
  
  const result = await db.query(
    `SELECT 
      id,
      policy_type as "policyType",
      version,
      content,
      effective_date as "effectiveDate",
      created_at as "createdAt"
    FROM policy_versions
    WHERE policy_type = $1
    ORDER BY effective_date DESC
    LIMIT 1`,
    [policyType]
  );
  
  return result.rows[0] || null;
}

/**
 * Create new policy version
 */
export async function createPolicyVersion(params: {
  policyType: 'privacy_policy' | 'terms_of_service';
  version: string;
  content: string;
  effectiveDate: string;
}): Promise<PolicyVersion> {
  const db = createClient();
  
  const result = await db.query(
    `INSERT INTO policy_versions (
      policy_type, version, content, effective_date
    )
    VALUES ($1, $2, $3, $4)
    RETURNING 
      id,
      policy_type as "policyType",
      version,
      content,
      effective_date as "effectiveDate",
      created_at as "createdAt"`,
    [params.policyType, params.version, params.content, params.effectiveDate]
  );
  
  return result.rows[0];
}

/**
 * Get marketing preferences
 */
export async function getMarketingPreferences(userId: string): Promise<MarketingPreferences> {
  const db = createClient();
  
  const result = await db.query(
    `SELECT 
      user_id as "userId",
      product_updates as "productUpdates",
      tips_best_practices as "tipsBestPractices",
      promotional_offers as "promotionalOffers",
      share_usage_data as "shareUsageData",
      updated_at as "updatedAt"
    FROM marketing_preferences
    WHERE user_id = $1`,
    [userId]
  );
  
  if (result.rows[0]) {
    return result.rows[0];
  }
  
  // Create default preferences (all false)
  const createResult = await db.query(
    `INSERT INTO marketing_preferences (user_id)
     VALUES ($1)
     RETURNING 
       user_id as "userId",
       product_updates as "productUpdates",
       tips_best_practices as "tipsBestPractices",
       promotional_offers as "promotionalOffers",
       share_usage_data as "shareUsageData",
       updated_at as "updatedAt"`,
    [userId]
  );
  
  return createResult.rows[0];
}

/**
 * Update marketing preferences
 */
export async function updateMarketingPreferences(params: {
  userId: string;
  productUpdates?: boolean;
  tipsBestPractices?: boolean;
  promotionalOffers?: boolean;
  shareUsageData?: boolean;
}): Promise<MarketingPreferences> {
  const db = createClient();
  
  const fields: string[] = [];
  const values: any[] = [params.userId];
  let paramIndex = 2;
  
  if (params.productUpdates !== undefined) {
    fields.push(`product_updates = $${paramIndex++}`);
    values.push(params.productUpdates);
  }
  
  if (params.tipsBestPractices !== undefined) {
    fields.push(`tips_best_practices = $${paramIndex++}`);
    values.push(params.tipsBestPractices);
  }
  
  if (params.promotionalOffers !== undefined) {
    fields.push(`promotional_offers = $${paramIndex++}`);
    values.push(params.promotionalOffers);
  }
  
  if (params.shareUsageData !== undefined) {
    fields.push(`share_usage_data = $${paramIndex++}`);
    values.push(params.shareUsageData);
  }
  
  fields.push('updated_at = NOW()');
  
  const result = await db.query(
    `UPDATE marketing_preferences
     SET ${fields.join(', ')}
     WHERE user_id = $1
     RETURNING 
       user_id as "userId",
       product_updates as "productUpdates",
       tips_best_practices as "tipsBestPractices",
       promotional_offers as "promotionalOffers",
       share_usage_data as "shareUsageData",
       updated_at as "updatedAt"`,
    values
  );
  
  return result.rows[0];
}

/**
 * Get users who opted in to specific marketing type
 */
export async function getUsersOptedInTo(marketingType: keyof Omit<MarketingPreferences, 'userId' | 'updatedAt'>): Promise<string[]> {
  const db = createClient();
  
  const columnMap = {
    productUpdates: 'product_updates',
    tipsBestPractices: 'tips_best_practices',
    promotionalOffers: 'promotional_offers',
    shareUsageData: 'share_usage_data',
  };
  
  const column = columnMap[marketingType];
  
  const result = await db.query(
    `SELECT user_id
     FROM marketing_preferences
     WHERE ${column} = TRUE`
  );
  
  return result.rows.map((row) => row.user_id);
}
