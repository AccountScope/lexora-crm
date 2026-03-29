import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Trust Account Reconciliation API
 * 
 * GET /api/trust-accounts/[accountId]/reconciliation
 * Returns latest reconciliation run, suggestions, and discrepancies
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { accountId: string } }
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

    const { accountId } = params;

    // Fetch latest reconciliation run
    const { data: latestRun, error: runError } = await supabase
      .from("reconciliation_runs")
      .select("*")
      .eq("trust_account_id", accountId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Fetch pending suggestions
    const { data: suggestions, error: suggestionsError } = await supabase
      .from("reconciliation_suggestions")
      .select(`
        id,
        confidence,
        match_reason,
        bank_transaction:bank_transactions!reconciliation_suggestions_bank_transaction_id_fkey (
          amount,
          description,
          transaction_date
        ),
        trust_transaction:trust_transactions!reconciliation_suggestions_trust_transaction_id_fkey (
          amount,
          description,
          transaction_date
        )
      `)
      .eq("status", "pending")
      .order("confidence", { ascending: false })
      .limit(10);

    // Fetch unresolved discrepancies
    const { data: discrepancies, error: discError } = await supabase
      .from("reconciliation_discrepancies")
      .select("*")
      .eq("status", "unresolved")
      .order("severity", { ascending: false })
      .limit(20);

    // Fetch bank connection status
    const { data: bankConnection, error: bankError } = await supabase
      .from("bank_connections")
      .select("*")
      .eq("trust_account_id", accountId)
      .eq("enabled", true)
      .single();

    return NextResponse.json({
      latestRun: latestRun || null,
      suggestions: suggestions || [],
      discrepancies: discrepancies || [],
      bankConnection: bankConnection || null,
    });
  } catch (error) {
    console.error("Reconciliation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
