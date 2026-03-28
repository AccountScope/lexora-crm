import { createClient } from '@/lib/api/db';
import { randomUUID } from 'crypto';

export interface DeletionRequest {
  id: string;
  userId: string;
  status: 'pending' | 'cancelled' | 'completed';
  cancellationToken: string;
  deletionDate: string;
  cancelledAt?: string;
  completedAt?: string;
  createdAt: string;
}

/**
 * Request account deletion (30-day grace period)
 */
export async function requestAccountDeletion(userId: string): Promise<DeletionRequest> {
  const db = createClient();
  
  const cancellationToken = randomUUID();
  const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  const result = await db.query(
    `INSERT INTO deletion_requests (
      user_id, 
      status, 
      cancellation_token, 
      deletion_date
    )
    VALUES ($1, 'pending', $2, $3)
    RETURNING 
      id,
      user_id as "userId",
      status,
      cancellation_token as "cancellationToken",
      deletion_date as "deletionDate",
      created_at as "createdAt"`,
    [userId, cancellationToken, deletionDate]
  );
  
  // Mark user as deletion requested
  await db.query(
    `UPDATE users
     SET 
       deletion_requested = TRUE,
       deletion_requested_at = NOW()
     WHERE id = $1`,
    [userId]
  );
  
  return result.rows[0];
}

/**
 * Cancel account deletion
 */
export async function cancelAccountDeletion(cancellationToken: string): Promise<void> {
  const db = createClient();
  
  // Get user ID from token
  const result = await db.query(
    'SELECT user_id FROM deletion_requests WHERE cancellation_token = $1',
    [cancellationToken]
  );
  
  const userId = result.rows[0]?.user_id;
  if (!userId) {
    throw new Error('Invalid cancellation token');
  }
  
  // Cancel deletion request
  await db.query(
    `UPDATE deletion_requests
     SET 
       status = 'cancelled',
       cancelled_at = NOW()
     WHERE cancellation_token = $1`,
    [cancellationToken]
  );
  
  // Unmark user
  await db.query(
    `UPDATE users
     SET 
       deletion_requested = FALSE,
       deletion_requested_at = NULL
     WHERE id = $1`,
    [userId]
  );
}

/**
 * Execute account deletion (anonymization)
 */
export async function executeAccountDeletion(userId: string): Promise<void> {
  const db = createClient();
  
  // Start transaction
  await db.query('BEGIN');
  
  try {
    // Anonymize user data
    await db.query(
      `UPDATE users
       SET 
         email = 'deleted-' || id || '@deleted.lexora.local',
         first_name = 'Deleted',
         last_name = 'User',
         phone = NULL,
         external_auth_id = NULL,
         status = 'DISABLED',
         two_factor_secret = NULL,
         two_factor_enabled = FALSE
       WHERE id = $1`,
      [userId]
    );
    
    // Delete sessions
    await db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    
    // Delete backup codes
    await db.query('DELETE FROM backup_codes WHERE user_id = $1', [userId]);
    
    // Delete password history
    await db.query('DELETE FROM password_history WHERE user_id = $1', [userId]);
    
    // Delete password reset tokens
    await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
    
    // Delete email verification tokens
    await db.query(
      `UPDATE users
       SET 
         email_verification_token = NULL,
         email_verification_expires = NULL
       WHERE id = $1`,
      [userId]
    );
    
    // Delete marketing preferences
    await db.query('DELETE FROM marketing_preferences WHERE user_id = $1', [userId]);
    
    // Anonymize consent records (keep for legal compliance)
    await db.query(
      `UPDATE consent_records
       SET ip_address = NULL, user_agent = NULL
       WHERE user_id = $1`,
      [userId]
    );
    
    // Anonymize login attempts
    await db.query(
      `UPDATE login_attempts
       SET email = 'deleted-' || $1 || '@deleted.lexora.local'
       WHERE email = (SELECT email FROM users WHERE id = $1)`,
      [userId]
    );
    
    // Anonymize audit logs (keep for legal compliance)
    await db.query(
      `UPDATE audit_logs
       SET ip_address = NULL, user_agent = NULL
       WHERE actor_user_id = $1`,
      [userId]
    );
    
    // NOTE: We keep case data, time entries, invoices for 7-year legal requirement
    // But anonymize the user's participation
    
    // Mark deletion request as completed
    await db.query(
      `UPDATE deletion_requests
       SET 
         status = 'completed',
         completed_at = NOW()
       WHERE user_id = $1
       AND status = 'pending'`,
      [userId]
    );
    
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

/**
 * Get pending deletion requests (for cron job)
 */
export async function getPendingDeletions(): Promise<DeletionRequest[]> {
  const db = createClient();
  
  const result = await db.query(
    `SELECT 
      id,
      user_id as "userId",
      status,
      cancellation_token as "cancellationToken",
      deletion_date as "deletionDate",
      created_at as "createdAt"
    FROM deletion_requests
    WHERE status = 'pending'
    AND deletion_date <= NOW()
    ORDER BY deletion_date ASC`
  );
  
  return result.rows;
}

/**
 * Get user's deletion request
 */
export async function getUserDeletionRequest(userId: string): Promise<DeletionRequest | null> {
  const db = createClient();
  
  const result = await db.query(
    `SELECT 
      id,
      user_id as "userId",
      status,
      cancellation_token as "cancellationToken",
      deletion_date as "deletionDate",
      cancelled_at as "cancelledAt",
      completed_at as "completedAt",
      created_at as "createdAt"
    FROM deletion_requests
    WHERE user_id = $1
    AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1`,
    [userId]
  );
  
  return result.rows[0] || null;
}

/**
 * Process pending deletions (cron job)
 */
export async function processPendingDeletions(): Promise<number> {
  const pending = await getPendingDeletions();
  
  let processed = 0;
  
  for (const request of pending) {
    try {
      await executeAccountDeletion(request.userId);
      processed++;
    } catch (error) {
      console.error(`Failed to delete user ${request.userId}:`, error);
    }
  }
  
  return processed;
}
