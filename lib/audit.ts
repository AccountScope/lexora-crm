import { createClient } from '@/lib/supabase/server';

export interface AuditLogParams {
  action: 'create' | 'update' | 'delete' | 'view' | 'download' | 'share' | 'login' | 'logout';
  entityType: string;
  entityId?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

/**
 * Log an action to the audit trail
 */
export async function logAudit(
  params: AuditLogParams,
  request?: Request
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('Audit log attempted without authenticated user');
      return;
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      console.warn('Audit log attempted for user without organization');
      return;
    }

    // Extract IP and user agent from request if available
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (request) {
      // Try to get real IP (handle proxies)
      ipAddress = 
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        null;
      
      userAgent = request.headers.get('user-agent');
    }

    // Insert audit log
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        changes: params.changes || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: params.metadata || {}
      });

    if (error) {
      console.error('Failed to create audit log:', error);
    }
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw - audit failures shouldn't break the main operation
  }
}

/**
 * Log a view action
 */
export async function logView(
  entityType: string,
  entityId: string,
  request?: Request
): Promise<void> {
  await logAudit({
    action: 'view',
    entityType,
    entityId
  }, request);
}

/**
 * Log a create action
 */
export async function logCreate(
  entityType: string,
  entityId: string,
  data: Record<string, any>,
  request?: Request
): Promise<void> {
  await logAudit({
    action: 'create',
    entityType,
    entityId,
    changes: {
      after: data
    }
  }, request);
}

/**
 * Log an update action
 */
export async function logUpdate(
  entityType: string,
  entityId: string,
  before: Record<string, any>,
  after: Record<string, any>,
  request?: Request
): Promise<void> {
  await logAudit({
    action: 'update',
    entityType,
    entityId,
    changes: {
      before,
      after
    }
  }, request);
}

/**
 * Log a delete action
 */
export async function logDelete(
  entityType: string,
  entityId: string,
  data: Record<string, any>,
  request?: Request
): Promise<void> {
  await logAudit({
    action: 'delete',
    entityType,
    entityId,
    changes: {
      before: data
    }
  }, request);
}

/**
 * Log a download action
 */
export async function logDownload(
  entityType: string,
  entityId: string,
  metadata?: Record<string, any>,
  request?: Request
): Promise<void> {
  await logAudit({
    action: 'download',
    entityType,
    entityId,
    metadata
  }, request);
}

/**
 * Log a share action
 */
export async function logShare(
  entityType: string,
  entityId: string,
  metadata?: Record<string, any>,
  request?: Request
): Promise<void> {
  await logAudit({
    action: 'share',
    entityType,
    entityId,
    metadata
  }, request);
}
