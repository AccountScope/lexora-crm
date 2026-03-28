import { db } from '@/lib/api/db';

type EmailForLinking = {
  id: string;
  from_email: string;
  subject: string;
  body_text: string | null;
};

type AutoLinkMatch = {
  emailId: string;
  caseId: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
};

/**
 * Auto-link emails to cases based on matching rules
 */
export async function autoLinkEmails(accountId: string): Promise<AutoLinkMatch[]> {
  // Get unlinked emails for this account
  const emailsResult = await db.query<EmailForLinking>(
    `SELECT id, from_email, subject, body_text 
    FROM emails 
    WHERE email_account_id = $1 AND case_id IS NULL
    ORDER BY date DESC
    LIMIT 100`,
    [accountId]
  );
  const emails = emailsResult.rows;

  const matches: AutoLinkMatch[] = [];

  for (const email of emails) {
    const match = await findCaseMatch(email);
    if (match) {
      matches.push(match);
    }
  }

  return matches;
}

/**
 * Find matching case for an email
 */
async function findCaseMatch(email: EmailForLinking): Promise<AutoLinkMatch | null> {
  // Rule 1: Match sender email to client email (HIGH confidence)
  const clientMatch = await db.queryOne<{ matter_id: string; client_name: string }>(
    `SELECT m.id as matter_id, c.company_name as client_name
    FROM clients c
    JOIN matters m ON m.client_id = c.id
    WHERE LOWER(c.email) = LOWER($1)
    LIMIT 1`,
    [email.from_email]
  );

  if (clientMatch) {
    return {
      emailId: email.id,
      caseId: clientMatch.matter_id,
      confidence: 'high',
      reason: `Sender email matches client: ${clientMatch.client_name}`,
    };
  }

  // Rule 2: Match case number in subject line (HIGH confidence)
  // Extract potential case numbers (e.g., CASE-12345, #12345, etc.)
  const caseNumberRegex = /(?:CASE[-\s]?|#)(\d{4,})/i;
  const subjectMatch = email.subject.match(caseNumberRegex);

  if (subjectMatch) {
    const caseNumber = subjectMatch[1];
    const caseMatch = await db.queryOne<{ id: string; case_number: string }>(
      `SELECT id, case_number FROM matters WHERE case_number ILIKE $1 LIMIT 1`,
      [`%${caseNumber}%`]
    );

    if (caseMatch) {
      return {
        emailId: email.id,
        caseId: caseMatch.id,
        confidence: 'high',
        reason: `Case number found in subject: ${caseMatch.case_number}`,
      };
    }
  }

  // Rule 3: Match client name in subject line (MEDIUM confidence)
  const clientsResult = await db.query<{ id: string; company_name: string; matter_id: string }>(
    `SELECT c.id, c.company_name, m.id as matter_id
    FROM clients c
    JOIN matters m ON m.client_id = c.id`
  );

  for (const client of clientsResult.rows) {
    if (email.subject.toLowerCase().includes(client.company_name.toLowerCase())) {
      return {
        emailId: email.id,
        caseId: client.matter_id,
        confidence: 'medium',
        reason: `Client name found in subject: ${client.company_name}`,
      };
    }
  }

  // Rule 4: Match email domain to client domain (LOW confidence)
  const domain = email.from_email.split('@')[1];
  if (domain) {
    const domainMatch = await db.queryOne<{ matter_id: string; company_name: string }>(
      `SELECT m.id as matter_id, c.company_name
      FROM clients c
      JOIN matters m ON m.client_id = c.id
      WHERE c.email ILIKE $1
      LIMIT 1`,
      [`%@${domain}`]
    );

    if (domainMatch) {
      return {
        emailId: email.id,
        caseId: domainMatch.matter_id,
        confidence: 'low',
        reason: `Email domain matches client: ${domainMatch.company_name}`,
      };
    }
  }

  return null;
}

/**
 * Apply auto-link match (with approval)
 */
export async function applyAutoLink(emailId: string, caseId: string): Promise<void> {
  await db.query(
    `UPDATE emails SET case_id = $1, auto_linked = TRUE WHERE id = $2`,
    [caseId, emailId]
  );
}

/**
 * Get auto-link suggestions for user review
 */
export async function getAutoLinkSuggestions(
  userId: string
): Promise<(AutoLinkMatch & { email_subject: string; case_number: string })[]> {
  // Get accounts for this user
  const accountsResult = await db.query<{ id: string }>(
    'SELECT id FROM email_accounts WHERE user_id = $1',
    [userId]
  );

  const allMatches: AutoLinkMatch[] = [];

  for (const account of accountsResult.rows) {
    const matches = await autoLinkEmails(account.id);
    allMatches.push(...matches);
  }

  // Enrich with email and case details
  const enriched = await Promise.all(
    allMatches.map(async (match) => {
      const email = await db.queryOne<{ subject: string }>(
        'SELECT subject FROM emails WHERE id = $1',
        [match.emailId]
      );
      const caseData = await db.queryOne<{ case_number: string }>(
        'SELECT case_number FROM matters WHERE id = $1',
        [match.caseId]
      );

      return {
        ...match,
        email_subject: email?.subject || '',
        case_number: caseData?.case_number || '',
      };
    })
  );

  return enriched;
}

/**
 * Bulk link emails to a case
 */
export async function bulkLinkEmails(emailIds: string[], caseId: string): Promise<number> {
  const result = await db.query(
    `UPDATE emails SET case_id = $1 WHERE id = ANY($2::uuid[])`,
    [caseId, emailIds]
  );

  return result.rowCount ?? 0;
}
