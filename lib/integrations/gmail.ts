/**
 * Gmail API Integration
 * Fetches emails for AI time capture
 */

import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
  labels: string[];
}

/**
 * Get OAuth URL for Gmail authorization
 */
export function getGmailAuthUrl(redirectUri: string, state: string): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state,
    prompt: "consent", // Force consent to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeGmailCode(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  email: string;
}> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new Error("Missing required tokens from Google OAuth");
  }

  // Get user's email address
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const profile = await gmail.users.getProfile({ userId: "me" });
  const email = profile.data.emailAddress || "";

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    email,
  };
}

/**
 * Refresh access token
 */
export async function refreshGmailToken(refreshToken: string): Promise<{
  access_token: string;
  expiry_date: number;
}> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token || !credentials.expiry_date) {
    throw new Error("Failed to refresh Gmail token");
  }

  return {
    access_token: credentials.access_token,
    expiry_date: credentials.expiry_date,
  };
}

/**
 * List emails for a date range
 */
export async function listGmailMessages(
  accessToken: string,
  refreshToken: string,
  startDate: Date,
  endDate: Date,
  maxResults: number = 50
): Promise<GmailMessage[]> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // Build query
  // Filter: not in spam/trash, after startDate, before endDate
  const afterTimestamp = Math.floor(startDate.getTime() / 1000);
  const beforeTimestamp = Math.floor(endDate.getTime() / 1000);
  const query = `after:${afterTimestamp} before:${beforeTimestamp} -in:spam -in:trash`;

  try {
    // List message IDs
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults,
    });

    const messages = listResponse.data.messages || [];
    if (messages.length === 0) {
      return [];
    }

    // Fetch full message details (batched)
    const fullMessages = await Promise.all(
      messages.map(async (msg) => {
        try {
          const msgResponse = await gmail.users.messages.get({
            userId: "me",
            id: msg.id!,
            format: "full",
          });

          return parseGmailMessage(msgResponse.data);
        } catch (error) {
          console.error(`Failed to fetch message ${msg.id}:`, error);
          return null;
        }
      })
    );

    return fullMessages.filter((msg): msg is GmailMessage => msg !== null);
  } catch (error) {
    console.error("Gmail API error:", error);
    throw new Error("Failed to fetch Gmail messages");
  }
}

/**
 * Parse Gmail message into our format
 */
function parseGmailMessage(message: any): GmailMessage | null {
  try {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
        ?.value || "";

    const subject = getHeader("subject");
    const from = getHeader("from");
    const to = getHeader("to");
    const date = getHeader("date");

    // Get message body
    let body = "";
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
    } else if (message.payload?.parts) {
      // Multipart message - find text/plain part
      const textPart = message.payload.parts.find(
        (part: any) => part.mimeType === "text/plain"
      );
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
    }

    // Truncate body to 1000 chars for analysis
    body = body.slice(0, 1000);

    return {
      id: message.id || "",
      threadId: message.threadId || "",
      subject,
      from,
      to,
      date,
      snippet: message.snippet || "",
      body,
      labels: message.labelIds || [],
    };
  } catch (error) {
    console.error("Failed to parse Gmail message:", error);
    return null;
  }
}

/**
 * Analyze email thread length (for time estimation)
 */
export async function getGmailThreadLength(
  accessToken: string,
  refreshToken: string,
  threadId: string
): Promise<number> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    const thread = await gmail.users.threads.get({
      userId: "me",
      id: threadId,
    });

    return thread.data.messages?.length || 1;
  } catch (error) {
    console.error("Failed to get thread length:", error);
    return 1; // Default to single message
  }
}

/**
 * Check if email is from a client (not internal)
 */
export function isClientEmail(from: string, userDomain: string): boolean {
  // Extract domain from "Name <email@domain.com>" format
  const emailMatch = from.match(/<(.+@.+)>/);
  const email = emailMatch ? emailMatch[1] : from;
  const domain = email.split("@")[1]?.toLowerCase();

  // If from same domain as user, it's internal
  return domain !== userDomain.toLowerCase();
}

/**
 * Estimate time spent on email
 */
export function estimateEmailTime(
  threadLength: number,
  bodyLength: number
): number {
  // Base: 10 mins per message in thread
  let minutes = threadLength * 10;

  // Adjustment based on body length
  if (bodyLength > 500) {
    minutes += 5; // Long email = more time
  }
  if (bodyLength > 1000) {
    minutes += 5; // Very long email = even more time
  }

  // Convert to hours, round to 0.1
  const hours = minutes / 60;
  return Math.round(hours * 10) / 10;
}
