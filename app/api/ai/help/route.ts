import { NextRequest, NextResponse } from "next/server";

/**
 * AI Help Chat API
 * Integrates with OpenAI GPT-4 or Anthropic Claude
 * 
 * Environment variables required:
 * - OPENAI_API_KEY (for OpenAI)
 * - ANTHROPIC_API_KEY (for Anthropic Claude)
 */

// Rate limiting (simple in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // messages per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Rate limiting (use IP or user ID in production)
    const identifier = req.headers.get("x-forwarded-for") || "anonymous";
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    // Check which AI provider is configured
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!openaiKey && !anthropicKey) {
      // Fallback to keyword-based responses if no API key configured
      return NextResponse.json(await getKeywordResponse(message));
    }

    // Use OpenAI if available (preferred for now)
    if (openaiKey) {
      const response = await getOpenAIResponse(message, conversationHistory);
      return NextResponse.json(response);
    }

    // Use Anthropic Claude as fallback
    if (anthropicKey) {
      const response = await getAnthropicResponse(message, conversationHistory);
      return NextResponse.json(response);
    }

    // This shouldn't happen but handle it anyway
    return NextResponse.json(await getKeywordResponse(message));
  } catch (error) {
    console.error("AI Help API Error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * OpenAI GPT-4 Integration
 */
async function getOpenAIResponse(
  message: string,
  history?: Array<{ role: string; content: string }>
): Promise<{ content: string; suggestions?: string[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key not configured");

  const systemPrompt = `You are a helpful assistant for Lexora, a legal practice management system for UK solicitors and barristers.

Key features you can help with:
- Case/Matter Management: Creating, tracking, and managing legal matters
- Trust Accounting: SRA-compliant client money management, three-way reconciliation
- Document Vault: Secure document storage with chain-of-custody tracking
- Time Tracking: Billable hours logging and invoice generation
- Client Portal: Secure client communication and document sharing
- Email Integration: Gmail/Outlook sync with case linking
- Conflict Checking: Preventing ethical conflicts between clients

Important context:
- Lexora is UK-focused (use UK legal terminology, SRA compliance, £ currency)
- Users are legal professionals (solicitors, barristers, paralegals)
- Tone should be professional, helpful, and accurate
- Focus on practical solutions and step-by-step guidance
- Reference UK legal regulations when relevant (SRA, GDPR, etc.)

When answering:
1. Be concise but thorough
2. Use legal terminology correctly
3. Provide actionable steps when possible
4. Suggest related help topics
5. Maintain professional tone (no jokes, emojis, or casual language)`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...(history || []).slice(-5), // Keep last 5 messages for context
    { role: "user", content: message },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "I couldn't generate a response.";

  // Generate suggestions based on the query
  const suggestions = generateSuggestions(message, content);

  return { content, suggestions };
}

/**
 * Anthropic Claude Integration
 */
async function getAnthropicResponse(
  message: string,
  history?: Array<{ role: string; content: string }>
): Promise<{ content: string; suggestions?: string[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Anthropic API key not configured");

  const systemPrompt = `You are a helpful assistant for Lexora, a legal practice management system for UK solicitors and barristers. Provide professional, accurate guidance on legal practice management features. Use UK legal terminology and maintain a professional tone.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        ...(history || []).slice(-5),
        { role: "user", content: message },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text || "I couldn't generate a response.";

  const suggestions = generateSuggestions(message, content);

  return { content, suggestions };
}

/**
 * Keyword-based fallback (no API key required)
 */
async function getKeywordResponse(
  message: string
): Promise<{ content: string; suggestions?: string[] }> {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("trust account") || lowerMessage.includes("reconcil")) {
    return {
      content:
        "Trust accounting in Lexora follows SRA regulations:\n\n1. **Separation**: Client money must be kept separate from firm funds\n2. **Three-Way Reconciliation**: Monthly requirement to match:\n   • Bank statement balance\n   • Trust ledger balance\n   • Sum of client ledgers\n3. **Audit Trail**: Every transaction is logged\n\nTo set up a trust account, go to Trust Accounting → Create Account.",
      suggestions: [
        "How do I perform reconciliation?",
        "What if the balances don't match?",
        "How do I create a trust account?",
      ],
    };
  }

  if (lowerMessage.includes("document") || lowerMessage.includes("upload")) {
    return {
      content:
        "The Document Vault provides secure storage with chain-of-custody tracking:\n\n• **Upload**: Drag and drop files or click the upload zone\n• **Chain of Custody**: Every access is logged (who, when, what)\n• **Classification**: Documents are categorized (Confidential, Privileged, etc.)\n• **Court Ready**: Includes metadata required for court submissions\n\nTo upload documents, go to Documents → Upload or drag files into the vault.",
      suggestions: [
        "How do I view the access log?",
        "What file types are supported?",
        "How do I organize documents?",
      ],
    };
  }

  if (lowerMessage.includes("matter") || lowerMessage.includes("case")) {
    return {
      content:
        "To create a new matter:\n\n1. Go to **Cases** in the sidebar\n2. Click **Create Matter**\n3. Fill in:\n   • Client details\n   • Matter type\n   • Practice area\n   • Lead attorney\n4. Click **Save**\n\nAll time entries, documents, and trust transactions can be linked to this matter.",
      suggestions: [
        "How do I assign team members?",
        "Can I link emails to matters?",
        "How do I close a matter?",
      ],
    };
  }

  if (lowerMessage.includes("time") || lowerMessage.includes("billing")) {
    return {
      content:
        "Time tracking in Lexora:\n\n1. **Start Timer**: Click the timer icon and select a matter\n2. **Manual Entry**: Go to Time → Add Entry\n3. **Billing**: Convert tracked time to invoices automatically\n4. **Rates**: Set hourly rates per attorney or matter type\n\nAll time entries are linked to matters for easy invoicing.",
      suggestions: [
        "How do I generate an invoice?",
        "Can I edit time entries?",
        "How do I mark time as non-billable?",
      ],
    };
  }

  // Default response
  return {
    content:
      "I can help with:\n\n• **Case Management**: Creating and tracking legal matters\n• **Trust Accounting**: SRA compliance and reconciliation\n• **Document Management**: Secure storage with chain of custody\n• **Time Tracking**: Billable hours and invoicing\n• **Email Integration**: Syncing and linking to cases\n\nWhat specific feature would you like to know about?",
    suggestions: [
      "How do I create a new matter?",
      "How does trust accounting work?",
      "How do I upload documents?",
      "How do I track billable time?",
    ],
  };
}

/**
 * Generate contextual follow-up suggestions
 */
function generateSuggestions(query: string, response: string): string[] {
  const lowerQuery = query.toLowerCase();
  const lowerResponse = response.toLowerCase();

  const suggestions: string[] = [];

  // Trust accounting related
  if (lowerQuery.includes("trust") || lowerResponse.includes("trust")) {
    suggestions.push("How do I perform monthly reconciliation?");
    suggestions.push("What is three-way reconciliation?");
  }

  // Document related
  if (lowerQuery.includes("document") || lowerResponse.includes("document")) {
    suggestions.push("How do I view the document access log?");
    suggestions.push("Can I version documents?");
  }

  // Case related
  if (lowerQuery.includes("matter") || lowerQuery.includes("case")) {
    suggestions.push("How do I link emails to matters?");
    suggestions.push("How do I assign team members?");
  }

  // Time tracking related
  if (lowerQuery.includes("time") || lowerQuery.includes("billing")) {
    suggestions.push("How do I generate an invoice?");
    suggestions.push("Can I track multiple matters simultaneously?");
  }

  // Add generic helpful suggestions if we don't have many
  if (suggestions.length < 2) {
    suggestions.push("Show me getting started guide");
    suggestions.push("How do I contact support?");
  }

  return suggestions.slice(0, 3); // Return max 3 suggestions
}
