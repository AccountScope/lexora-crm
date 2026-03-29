import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Matter Milestones API
 * Returns progress milestones for a matter
 * 
 * GET /api/matters/[matterId]/milestones
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

    // Fetch milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from("matter_milestones")
      .select("*")
      .eq("matter_id", matterId)
      .order("milestone_order", { ascending: true });

    if (milestonesError) {
      console.error("Failed to fetch milestones:", milestonesError);
      return NextResponse.json(
        { error: "Failed to fetch milestones" },
        { status: 500 }
      );
    }

    // Calculate progress
    const completedCount = (milestones || []).filter(
      (m: any) => m.status === "completed"
    ).length;
    const totalCount = (milestones || []).filter(
      (m: any) => m.status !== "skipped"
    ).length;

    return NextResponse.json({
      milestones: milestones || [],
      progress: {
        completed: completedCount,
        total: totalCount,
        percentage: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
      },
      matter: {
        id: matter.id,
        title: matter.title,
      },
    });
  } catch (error) {
    console.error("Milestones API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Create or update milestone
 * 
 * POST /api/matters/[matterId]/milestones
 * Body: {
 *   milestoneName: "Discovery complete",
 *   milestoneOrder: 1,
 *   estimatedCompletionDate: "2026-04-15"
 * }
 * 
 * PUT /api/matters/[matterId]/milestones/[milestoneId]
 * Body: {
 *   status: "completed"
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
    const { milestoneName, milestoneOrder, estimatedCompletionDate } = body;

    if (!milestoneName || !milestoneOrder) {
      return NextResponse.json(
        { error: "milestoneName and milestoneOrder are required" },
        { status: 400 }
      );
    }

    // Create milestone
    const { data: milestone, error: createError } = await supabase
      .from("matter_milestones")
      .insert({
        matter_id: matterId,
        milestone_name: milestoneName,
        milestone_order: milestoneOrder,
        estimated_completion_date: estimatedCompletionDate || null,
        status: "pending",
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create milestone:", createError);
      return NextResponse.json(
        { error: "Failed to create milestone" },
        { status: 500 }
      );
    }

    return NextResponse.json({ milestone }, { status: 201 });
  } catch (error) {
    console.error("Milestones API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
