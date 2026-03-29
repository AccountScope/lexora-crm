import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Matter Messages API
 * Secure two-way messaging between clients and solicitors
 * 
 * GET /api/matters/[matterId]/messages
 * Returns all messages for a matter
 * 
 * POST /api/matters/[matterId]/messages
 * Send a new message
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { matterId: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matterId } = params;

    // Verify matter exists
    const { data: matter, error: matterError } = await supabase
      .from("cases")
      .select("id, title")
      .eq("id", matterId)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from("client_portal_messages")
      .select("*")
      .eq("matter_id", matterId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Failed to fetch messages:", messagesError);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    // Mark messages as read for current user
    // TODO: Implement read receipts based on sender type
    // For now, just return messages

    return NextResponse.json({
      messages: messages || [],
      matter: {
        id: matter.id,
        title: matter.title,
      },
    });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Send message
 * 
 * POST /api/matters/[matterId]/messages
 * Body: {
 *   message: "Text content",
 *   senderType: "client" | "solicitor",
 *   attachments: [{ name, url, size }]
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { matterId: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matterId } = params;
    const body = await req.json();
    const { message, senderType, attachments } = body;

    // Validate inputs
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    if (!senderType || !["client", "solicitor"].includes(senderType)) {
      return NextResponse.json(
        { error: "Invalid sender type" },
        { status: 400 }
      );
    }

    // Verify matter exists
    const { data: matter, error: matterError } = await supabase
      .from("cases")
      .select("id, client_id")
      .eq("id", matterId)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    // Create message
    const { data: newMessage, error: createError } = await supabase
      .from("client_portal_messages")
      .insert({
        matter_id: matterId,
        sender_type: senderType,
        sender_id: user.id,
        message: message.trim(),
        attachments: attachments || null,
        read: false,
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create message:", createError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // TODO: Send notification to recipient
    // If senderType === "client", notify solicitor
    // If senderType === "solicitor", notify client portal user

    // TODO: Send email notification
    // Async job to send email with message preview

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Mark message as read
 * 
 * PUT /api/matters/[matterId]/messages/[messageId]/read
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { matterId: string; messageId: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = params;

    // Mark as read
    const { error: updateError } = await supabase
      .from("client_portal_messages")
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (updateError) {
      console.error("Failed to mark message as read:", updateError);
      return NextResponse.json(
        { error: "Failed to update message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
