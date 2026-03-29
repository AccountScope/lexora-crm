/**
 * OpenAI Integration for AI Time Capture
 * Smart matter matching and time estimation
 */

interface Matter {
  id: string;
  title: string;
  matterNumber: string;
  clientName: string;
  practiceArea?: string;
}

interface EmailData {
  subject: string;
  from: string;
  to: string;
  body: string;
  date: string;
}

interface MatchResult {
  matterId: string | null;
  confidence: number;
  reasoning?: string;
  suggestedDescription?: string;
  activityCode?: string;
}

/**
 * Match email to matter using GPT-4
 */
export async function matchEmailToMatter(
  email: EmailData,
  matters: Matter[]
): Promise<MatchResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Fallback to basic string matching if no API key
    return fallbackMatching(email, matters);
  }

  try {
    const prompt = buildMatchingPrompt(email, matters);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant helping UK solicitors match emails to legal matters. Analyze the email and match it to the most relevant matter, or respond with null if no clear match exists. Consider client names, matter types, keywords, and context. Be conservative - only match if confidence is >60%.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      return fallbackMatching(email, matters);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return fallbackMatching(email, matters);
    }

    const result = JSON.parse(content);

    return {
      matterId: result.matter_id || null,
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning,
      suggestedDescription: result.suggested_description,
      activityCode: result.activity_code,
    };
  } catch (error) {
    console.error("OpenAI matching error:", error);
    return fallbackMatching(email, matters);
  }
}

/**
 * Build prompt for GPT-4 matching
 */
function buildMatchingPrompt(email: EmailData, matters: Matter[]): string {
  const mattersList = matters
    .map(
      (m, i) =>
        `${i + 1}. ID: ${m.id}, Matter: ${m.title}, Client: ${m.clientName}, Number: ${m.matterNumber}${m.practiceArea ? `, Area: ${m.practiceArea}` : ""}`
    )
    .join("\n");

  return `Email to analyze:
Subject: ${email.subject}
From: ${email.from}
Body (first 500 chars): ${email.body.slice(0, 500)}

Available matters:
${mattersList}

Task: Match this email to ONE matter, or respond with null if no clear match.

Respond with JSON:
{
  "matter_id": "uuid or null",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "suggested_description": "time entry description (e.g., 'Client correspondence re: contract review')",
  "activity_code": "UTBMS code (L110 for correspondence, L120 for drafting, L210 for meetings, etc.)"
}

UTBMS Activity Codes:
- L110: Client correspondence
- L120: Document drafting/review
- L130: Legal research
- L210: Client meetings
- L310: Court preparation
- L320: Court appearances
- L410: Negotiations
- L510: Discovery/investigation

Be conservative - only match if clearly related (>0.6 confidence).`;
}

/**
 * Fallback matching using simple string similarity
 */
function fallbackMatching(email: EmailData, matters: Matter[]): MatchResult {
  const emailText = `${email.subject} ${email.from} ${email.body}`.toLowerCase();

  let bestMatch: Matter | null = null;
  let bestScore = 0;

  for (const matter of matters) {
    let score = 0;

    // Check for exact matter number match
    if (emailText.includes(matter.matterNumber.toLowerCase())) {
      score += 0.9;
    }

    // Check for client name match
    const clientWords = matter.clientName.toLowerCase().split(" ");
    const matchedWords = clientWords.filter((word) =>
      word.length > 3 && emailText.includes(word)
    );
    score += (matchedWords.length / clientWords.length) * 0.7;

    // Check for matter title keywords
    const titleWords = matter.title.toLowerCase().split(" ");
    const matchedTitleWords = titleWords.filter(
      (word) => word.length > 4 && emailText.includes(word)
    );
    score += (matchedTitleWords.length / titleWords.length) * 0.5;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = matter;
    }
  }

  // Only return match if score > 0.6
  if (bestScore < 0.6 || !bestMatch) {
    return {
      matterId: null,
      confidence: 0,
      suggestedDescription: email.subject,
      activityCode: guessActivityCode(email),
    };
  }

  return {
    matterId: bestMatch.id,
    confidence: Math.min(bestScore, 0.9), // Cap at 0.9 for fallback
    suggestedDescription: `Client correspondence: ${email.subject}`,
    activityCode: guessActivityCode(email),
  };
}

/**
 * Guess activity code from email content
 */
function guessActivityCode(email: EmailData): string {
  const text = `${email.subject} ${email.body}`.toLowerCase();

  if (
    text.includes("court") ||
    text.includes("hearing") ||
    text.includes("trial")
  ) {
    return "L320"; // Court appearance
  }

  if (
    text.includes("meeting") ||
    text.includes("call scheduled") ||
    text.includes("zoom")
  ) {
    return "L210"; // Meeting
  }

  if (
    text.includes("draft") ||
    text.includes("contract") ||
    text.includes("agreement") ||
    text.includes("review")
  ) {
    return "L120"; // Drafting/review
  }

  if (
    text.includes("research") ||
    text.includes("precedent") ||
    text.includes("case law")
  ) {
    return "L130"; // Legal research
  }

  if (
    text.includes("negotiat") ||
    text.includes("settlement") ||
    text.includes("offer")
  ) {
    return "L410"; // Negotiations
  }

  // Default: correspondence
  return "L110";
}

/**
 * Analyze calendar event and suggest time entry
 */
export async function analyzeCalendarEvent(
  event: {
    summary: string;
    description?: string;
    location?: string;
    attendees?: string[];
  },
  matters: Matter[]
): Promise<MatchResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Fallback to basic matching
    const text = `${event.summary} ${event.description || ""} ${event.location || ""}`.toLowerCase();

    for (const matter of matters) {
      if (
        text.includes(matter.title.toLowerCase()) ||
        text.includes(matter.clientName.toLowerCase())
      ) {
        const activityCode = event.location?.toLowerCase().includes("court")
          ? "L320"
          : "L210";

        return {
          matterId: matter.id,
          confidence: 0.8,
          suggestedDescription: event.summary,
          activityCode,
        };
      }
    }

    return {
      matterId: null,
      confidence: 0,
      suggestedDescription: event.summary,
      activityCode: "L210", // Default to meeting
    };
  }

  // Similar GPT-4 matching as email
  // Implementation similar to matchEmailToMatter
  // Omitted for brevity - use same pattern

  return {
    matterId: null,
    confidence: 0,
    suggestedDescription: event.summary,
    activityCode: "L210",
  };
}

/**
 * Estimate time from email complexity
 */
export async function estimateEmailTime(email: {
  subject: string;
  body: string;
  threadLength: number;
}): Promise<number> {
  // Simple heuristic:
  // - 10 mins per email in thread
  // - +5 mins if body > 500 chars
  // - +5 mins if body > 1000 chars

  let minutes = email.threadLength * 10;

  if (email.body.length > 500) minutes += 5;
  if (email.body.length > 1000) minutes += 5;

  // Round to 0.1 hours
  const hours = minutes / 60;
  return Math.round(hours * 10) / 10;
}

/**
 * Batch analyze multiple emails (more efficient)
 */
export async function batchAnalyzeEmails(
  emails: EmailData[],
  matters: Matter[]
): Promise<MatchResult[]> {
  // For now: sequential processing
  // Future: batch API calls to save tokens

  const results = await Promise.all(
    emails.map((email) => matchEmailToMatter(email, matters))
  );

  return results;
}
