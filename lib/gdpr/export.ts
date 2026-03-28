import { createClient } from '@/lib/api/db';
import { randomUUID } from 'crypto';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

export interface DataExportRequest {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'ready' | 'downloaded' | 'expired';
  filePath?: string;
  downloadToken?: string;
  expiresAt?: string;
  downloadedAt?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Request data export for a user
 */
export async function requestDataExport(userId: string): Promise<DataExportRequest> {
  const db = createClient();
  
  const result = await db.query(
    `INSERT INTO data_export_requests (user_id, status)
     VALUES ($1, 'pending')
     RETURNING 
       id,
       user_id as "userId",
       status,
       created_at as "createdAt"`,
    [userId]
  );
  
  return result.rows[0];
}

/**
 * Get user's export requests
 */
export async function getUserExportRequests(userId: string): Promise<DataExportRequest[]> {
  const db = createClient();
  
  const result = await db.query(
    `SELECT 
      id,
      user_id as "userId",
      status,
      file_path as "filePath",
      download_token as "downloadToken",
      expires_at as "expiresAt",
      downloaded_at as "downloadedAt",
      created_at as "createdAt",
      completed_at as "completedAt"
    FROM data_export_requests
    WHERE user_id = $1
    ORDER BY created_at DESC`,
    [userId]
  );
  
  return result.rows;
}

/**
 * Generate data export ZIP file
 */
export async function generateDataExport(requestId: string): Promise<string> {
  const db = createClient();
  
  // Update status to processing
  await db.query(
    `UPDATE data_export_requests SET status = 'processing' WHERE id = $1`,
    [requestId]
  );
  
  // Get request details
  const requestResult = await db.query(
    'SELECT user_id FROM data_export_requests WHERE id = $1',
    [requestId]
  );
  
  const userId = requestResult.rows[0]?.user_id;
  if (!userId) {
    throw new Error('Export request not found');
  }
  
  // Create export directory
  const exportDir = path.join(process.cwd(), 'exports', requestId);
  fs.mkdirSync(exportDir, { recursive: true });
  
  // Fetch all user data
  const userData = await fetchUserData(userId);
  
  // Write data to JSON files
  fs.writeFileSync(
    path.join(exportDir, 'profile.json'),
    JSON.stringify(userData.profile, null, 2)
  );
  
  fs.writeFileSync(
    path.join(exportDir, 'cases.json'),
    JSON.stringify(userData.cases, null, 2)
  );
  
  fs.writeFileSync(
    path.join(exportDir, 'time_entries.json'),
    JSON.stringify(userData.timeEntries, null, 2)
  );
  
  fs.writeFileSync(
    path.join(exportDir, 'login_history.json'),
    JSON.stringify(userData.loginHistory, null, 2)
  );
  
  fs.writeFileSync(
    path.join(exportDir, 'audit_logs.json'),
    JSON.stringify(userData.auditLogs, null, 2)
  );
  
  // Write README
  fs.writeFileSync(
    path.join(exportDir, 'README.txt'),
    generateReadme()
  );
  
  // Create ZIP file
  const zipPath = path.join(process.cwd(), 'exports', `${requestId}.zip`);
  await createZipArchive(exportDir, zipPath);
  
  // Generate download token
  const downloadToken = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  // Update request
  await db.query(
    `UPDATE data_export_requests
     SET 
       status = 'ready',
       file_path = $2,
       download_token = $3,
       expires_at = $4,
       completed_at = NOW()
     WHERE id = $1`,
    [requestId, zipPath, downloadToken, expiresAt]
  );
  
  // Clean up temp directory
  fs.rmSync(exportDir, { recursive: true });
  
  return downloadToken;
}

/**
 * Fetch all user data for export
 */
async function fetchUserData(userId: string) {
  const db = createClient();
  
  // Profile
  const profileResult = await db.query(
    `SELECT 
      id, email, first_name, last_name, phone, timezone,
      user_type, status, created_at, updated_at
    FROM users WHERE id = $1`,
    [userId]
  );
  
  // Cases (as participant)
  const casesResult = await db.query(
    `SELECT 
      m.id, m.matter_number, m.title, m.description, m.status,
      m.practice_area, m.opens_on, m.closes_on, m.created_at
    FROM matters m
    JOIN matter_participants mp ON m.id = mp.matter_id
    WHERE mp.user_id = $1`,
    [userId]
  );
  
  // Time Entries
  const timeResult = await db.query(
    `SELECT 
      id, matter_id, work_date, description, hours, hourly_rate,
      amount, status, billable, created_at
    FROM time_entries WHERE user_id = $1`,
    [userId]
  );
  
  // Login History
  const loginResult = await db.query(
    `SELECT 
      email, ip_address, success, device, browser, location, created_at
    FROM login_attempts 
    WHERE email = (SELECT email FROM users WHERE id = $1)
    ORDER BY created_at DESC
    LIMIT 100`,
    [userId]
  );
  
  // Audit Logs
  const auditResult = await db.query(
    `SELECT 
      occurred_at, event_type, target_table, changes
    FROM audit_logs
    WHERE actor_user_id = $1
    ORDER BY occurred_at DESC
    LIMIT 500`,
    [userId]
  );
  
  return {
    profile: profileResult.rows[0] || {},
    cases: casesResult.rows || [],
    timeEntries: timeResult.rows || [],
    loginHistory: loginResult.rows || [],
    auditLogs: auditResult.rows || [],
  };
}

/**
 * Create ZIP archive
 */
function createZipArchive(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));
    
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

/**
 * Generate README content
 */
function generateReadme(): string {
  return `LEXORA - Your Data Export
================================

This archive contains all your personal data stored in LEXORA.

FILES:
------
- profile.json: Your account information
- cases.json: All cases/matters you're involved in
- time_entries.json: Your time tracking records
- login_history.json: Recent login attempts (last 100)
- audit_logs.json: Your activity history (last 500 events)

DATA DICTIONARY:
----------------
All dates/timestamps are in ISO 8601 format (UTC).
All monetary amounts are in the currency specified in your account settings.

PRIVACY:
--------
This export is provided under GDPR Article 15 (Right to Access).
It contains all personal data we hold about you.

For questions, contact: support@lexora.com

Generated: ${new Date().toISOString()}
Expires: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}
`;
}

/**
 * Mark export as downloaded
 */
export async function markExportDownloaded(downloadToken: string): Promise<void> {
  const db = createClient();
  
  await db.query(
    `UPDATE data_export_requests
     SET 
       status = 'downloaded',
       downloaded_at = NOW()
     WHERE download_token = $1`,
    [downloadToken]
  );
}

/**
 * Clean up expired exports (cron job)
 */
export async function cleanupExpiredExports(): Promise<number> {
  const db = createClient();
  
  const result = await db.query(
    `SELECT file_path
     FROM data_export_requests
     WHERE expires_at < NOW()
     AND status IN ('ready', 'downloaded')`
  );
  
  let cleaned = 0;
  
  for (const row of result.rows) {
    if (row.file_path && fs.existsSync(row.file_path)) {
      fs.unlinkSync(row.file_path);
      cleaned++;
    }
  }
  
  await db.query(
    `UPDATE data_export_requests
     SET status = 'expired'
     WHERE expires_at < NOW()
     AND status IN ('ready', 'downloaded')`
  );
  
  return cleaned;
}
