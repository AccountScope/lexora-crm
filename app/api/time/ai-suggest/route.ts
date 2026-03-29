import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * AI Time Capture API
 * Analyzes emails and calendar events to suggest time entries
 * 
 * POST /api/time/ai-suggest
 * Body: {
 *   source: "email" | "calendar",
 *   startDate: "2026-03-01",
 *   endDate: "2026-03-29",
 *   limit: 50
 * }
 * 
 * Response: {
 *   suggestions: [
 *     {
 *       id: "uuid",
 *       source: "email",
 *       sourceId: "email-123",
 *       date: "2026-03-29",
 *       suggestedHours: 0.5,
 *       description: "Client correspondence re: contract review",
 *       matterId: "uuid",
 *       matterTitle: "Smith v Jones",
 *       clientName: "John Smith",
 *       confidence: 0.92,
 *       rawData: { subject: "...", from: "...", to: "..." }
 *     }
 *   ],
 *   stats: {
 *     totalSuggestions: 15,
 *     totalHours: 7.5,
 *     highConfidence: 12,
 *     needsReview: 3
 *   }
 * }
 */

interface TimeSuggestion {
  id: string;
  source: "email" | "calendar" | "document";
  sourceId: string;
  date: string;
  suggestedHours: number;
  description: string;
  matterId: string | null;
  matterTitle: string | null;
  clientName: string | null;
  confidence: number;
  rawData: any;
  activityCode?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { source, startDate, endDate, limit = 50 } = body;

    // Validate inputs
    if (!source || !["email", "calendar", "document"].includes(source)) {
      return NextResponse.json(
        { error: "Invalid source. Must be: email, calendar, or document" },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Get user's email integrations
    const { data: integrations } = await supabase
      .from("email_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("enabled", true)
      .single();

    if (!integrations && source === "email") {
      return NextResponse.json(
        {
          error: "No email integration configured",
          hint: "Connect Gmail or Outlook in Settings to use AI Time Capture",
        },
        { status: 400 }
      );
    }

    // Fetch user's matters for context
    const { data: matters } = await supabase
      .from("cases")
      .select(`
        id,
        matter_number,
        title,
        client:clients!cases_client_id_fkey (
          id,
          legal_name,
          display_name
        )
      `)
      .eq("status", "active")
      .limit(100);

    if (!matters || matters.length === 0) {
      return NextResponse.json(
        {
          suggestions: [],
          stats: {
            totalSuggestions: 0,
            totalHours: 0,
            highConfidence: 0,
            needsReview: 0,
          },
          message: "No active matters found. Create a matter first.",
        },
        { status: 200 }
      );
    }

    // Generate AI suggestions based on source
    let suggestions: TimeSuggestion[] = [];

    if (source === "email") {
      suggestions = await generateEmailSuggestions(
        user.id,
        startDate,
        endDate,
        matters,
        limit
      );
    } else if (source === "calendar") {
      suggestions = await generateCalendarSuggestions(
        user.id,
        startDate,
        endDate,
        matters,
        limit
      );
    } else if (source === "document") {
      suggestions = await generateDocumentSuggestions(
        user.id,
        startDate,
        endDate,
        matters,
        limit
      );
    }

    // Calculate stats
    const stats = {
      totalSuggestions: suggestions.length,
      totalHours: suggestions.reduce((sum, s) => sum + s.suggestedHours, 0),
      highConfidence: suggestions.filter((s) => s.confidence >= 0.8).length,
      needsReview: suggestions.filter((s) => s.confidence < 0.8).length,
    };

    return NextResponse.json({
      suggestions,
      stats,
      message: `Found ${suggestions.length} time entry suggestions from ${source}`,
    });
  } catch (error) {
    console.error("AI time suggestion error:", error);
    return NextResponse.json(
      { error: "Failed to generate time suggestions" },
      { status: 500 }
    );
  }
}

/**
 * Generate time suggestions from emails
 */
async function generateEmailSuggestions(
  userId: string,
  startDate: string,
  endDate: string,
  matters: any[],
  limit: number
): Promise<TimeSuggestion[]> {
  // In production: Fetch emails from Gmail/Outlook API
  // For now: Return demo suggestions

  const suggestions: TimeSuggestion[] = [];

  // Demo data (replace with real API calls)
  const demoEmails = [
    {
      id: "email-1",
      subject: "Contract review - Smith v Jones",
      from: "john.smith@example.com",
      to: "lawyer@lawfirm.com",
      date: "2026-03-29T10:30:00Z",
      threadLength: 3,
    },
    {
      id: "email-2",
      subject: "Court filing confirmation",
      from: "court@justice.gov.uk",
      to: "lawyer@lawfirm.com",
      date: "2026-03-29T14:15:00Z",
      threadLength: 1,
    },
  ];

  for (const email of demoEmails.slice(0, limit)) {
    // Match email to matter (using AI or rules)
    const matchedMatter = matters.find((m) =>
      email.subject.toLowerCase().includes(m.title.toLowerCase())
    );

    suggestions.push({
      id: `suggestion-${email.id}`,
      source: "email",
      sourceId: email.id,
      date: email.date.slice(0, 10),
      suggestedHours: estimateEmailTime(email.threadLength),
      description: `Client correspondence: ${email.subject}`,
      matterId: matchedMatter?.id || null,
      matterTitle: matchedMatter?.title || null,
      clientName: matchedMatter?.client?.display_name || matchedMatter?.client?.legal_name || null,
      confidence: matchedMatter ? 0.9 : 0.5,
      rawData: email,
      activityCode: "L110", // Client correspondence
    });
  }

  return suggestions;
}

/**
 * Generate time suggestions from calendar events
 */
async function generateCalendarSuggestions(
  userId: string,
  startDate: string,
  endDate: string,
  matters: any[],
  limit: number
): Promise<TimeSuggestion[]> {
  // In production: Fetch from Google Calendar / Outlook API
  // For now: Return demo suggestions

  const suggestions: TimeSuggestion[] = [];

  const demoEvents = [
    {
      id: "event-1",
      summary: "Client meeting - Smith matter",
      start: "2026-03-29T09:00:00Z",
      end: "2026-03-29T10:00:00Z",
      attendees: ["john.smith@example.com"],
    },
    {
      id: "event-2",
      summary: "Court appearance - Jones case",
      start: "2026-03-29T14:00:00Z",
      end: "2026-03-29T16:00:00Z",
      location: "Royal Courts of Justice",
    },
  ];

  for (const event of demoEvents.slice(0, limit)) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Match event to matter
    const matchedMatter = matters.find((m) =>
      event.summary.toLowerCase().includes(m.title.toLowerCase())
    );

    suggestions.push({
      id: `suggestion-${event.id}`,
      source: "calendar",
      sourceId: event.id,
      date: event.start.slice(0, 10),
      suggestedHours: Math.round(durationHours * 10) / 10,
      description: event.summary,
      matterId: matchedMatter?.id || null,
      matterTitle: matchedMatter?.title || null,
      clientName: matchedMatter?.client?.display_name || matchedMatter?.client?.legal_name || null,
      confidence: matchedMatter ? 0.95 : 0.6,
      rawData: event,
      activityCode: event.location ? "L320" : "L210", // Court appearance or meeting
    });
  }

  return suggestions;
}

/**
 * Generate time suggestions from document work
 */
async function generateDocumentSuggestions(
  userId: string,
  startDate: string,
  endDate: string,
  matters: any[],
  limit: number
): Promise<TimeSuggestion[]> {
  // In production: Track document edits/uploads
  // For now: Return demo suggestions

  const suggestions: TimeSuggestion[] = [];

  const demoDocuments = [
    {
      id: "doc-1",
      name: "Contract_Draft_v3.docx",
      matterId: matters[0]?.id,
      uploadedAt: "2026-03-29T11:20:00Z",
      size: 45000, // bytes
    },
  ];

  for (const doc of demoDocuments.slice(0, limit)) {
    const matchedMatter = matters.find((m) => m.id === doc.matterId);
    const estimatedHours = estimateDocumentTime(doc.size);

    suggestions.push({
      id: `suggestion-${doc.id}`,
      source: "document",
      sourceId: doc.id,
      date: doc.uploadedAt.slice(0, 10),
      suggestedHours: estimatedHours,
      description: `Document work: ${doc.name}`,
      matterId: matchedMatter?.id || null,
      matterTitle: matchedMatter?.title || null,
      clientName: matchedMatter?.client?.display_name || matchedMatter?.client?.legal_name || null,
      confidence: 0.85,
      rawData: doc,
      activityCode: "L120", // Document drafting
    });
  }

  return suggestions;
}

/**
 * Estimate time spent on email based on thread length
 */
function estimateEmailTime(threadLength: number): number {
  // Simple heuristic: 10 mins per email in thread
  const minutes = threadLength * 10;
  return Math.round((minutes / 60) * 10) / 10; // Round to 0.1 hours
}

/**
 * Estimate time spent on document based on size
 */
function estimateDocumentTime(sizeBytes: number): number {
  // Heuristic: 1 hour per 50KB of document
  const kb = sizeBytes / 1000;
  const hours = kb / 50;
  return Math.max(0.1, Math.round(hours * 10) / 10);
}
