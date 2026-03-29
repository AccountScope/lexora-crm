import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Matter Timeline API
 * Returns real-time activity feed for a matter
 * 
 * GET /api/matters/[matterId]/timeline?view=client|all
 * 
 * Query params:
 * - view: "client" (only client-visible events) or "all" (include internal)
 * - limit: Number of events to return (default 50)
 * 
 * Returns:
 * {
 *   events: [
 *     {
 *       id: "uuid",
 *       eventType: "document_uploaded",
 *       title: "Document uploaded",
 *       description: "Contract draft v3",
 *       createdAt: "2026-03-29T12:00:00Z",
 *       metadata: { documentId: "...", documentName: "..." }
 *     }
 *   ]
 * }
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { matterId: string } }
) {
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

    const { matterId } = params;
    const url = new URL(req.url);
    const view = url.searchParams.get("view") || "all";
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    // Verify user has access to this matter
    const { data: matter, error: matterError } = await supabase
      .from("cases")
      .select("id, client_id")
      .eq("id", matterId)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    // Build query based on view
    let query = supabase
      .from("matter_timeline_events")
      .select("*")
      .eq("matter_id", matterId)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter by visibility for client view
    if (view === "client") {
      query = query.in("visibility", ["client", "all"]);
    }

    const { data: events, error: eventsError } = await query;

    if (eventsError) {
      console.error("Failed to fetch timeline events:", eventsError);
      return NextResponse.json(
        { error: "Failed to fetch timeline" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      events: events || [],
      matter: {
        id: matter.id,
        clientId: matter.client_id,
      },
    });
  } catch (error) {
    console.error("Timeline API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Create timeline event
 * 
 * POST /api/matters/[matterId]/timeline
 * Body: {
 *   eventType: "document_uploaded" | "status_update" | etc.,
 *   title: "Document uploaded",
 *   description: "Contract draft v3",
 *   visibility: "client" | "internal" | "all",
 *   metadata: { documentId: "...", documentName: "..." }
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { matterId: string } }
) {
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

    const { matterId } = params;
    const body = await req.json();
    const { eventType, title, description, visibility, metadata } = body;

    // Validate inputs
    if (!eventType || !title) {
      return NextResponse.json(
        { error: "eventType and title are required" },
        { status: 400 }
      );
    }

    // Verify matter exists
    const { data: matter, error: matterError } = await supabase
      .from("cases")
      .select("id")
      .eq("id", matterId)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    // Create timeline event
    const { data: event, error: createError } = await supabase
      .from("matter_timeline_events")
      .insert({
        matter_id: matterId,
        event_type: eventType,
        title,
        description: description || null,
        visibility: visibility || "client",
        created_by: user.id,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create timeline event:", createError);
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: 500 }
      );
    }

    // TODO: Trigger notification to client if visibility includes "client"
    if (visibility === "client" || visibility === "all") {
      // Create notification for client portal users
      // (Implementation depends on client notification system)
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Timeline API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
