import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Run Trust Account Reconciliation
 * 
 * POST /api/trust-accounts/[accountId]/reconciliation/run
 * 
 * Triggers automated three-way reconciliation:
 * 1. Fetch latest bank transactions
 * 2. Calculate client ledger balance
 * 3. Compare three-way (bank vs client vs office)
 * 4. Generate suggestions for matches
 * 5. Detect discrepancies
 * 6. Generate SRA report if compliant
 */

export async function POST(
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

    // Verify trust account exists
    const { data: account, error: accountError } = await supabase
      .from("trust_accounts")
      .select("id, account_name")
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: "Trust account not found" },
        { status: 404 }
      );
    }

    // Call SQL function to run reconciliation
    const { data: result, error: funcError } = await supabase.rpc(
      "run_three_way_reconciliation",
      { account_id: accountId }
    );

    if (funcError) {
      console.error("Reconciliation function error:", funcError);
      return NextResponse.json(
        { error: "Failed to run reconciliation" },
        { status: 500 }
      );
    }

    // Fetch the created reconciliation run
    const { data: run, error: runError } = await supabase
      .from("reconciliation_runs")
      .select("*")
      .eq("id", result)
      .single();

    if (runError || !run) {
      return NextResponse.json(
        { error: "Failed to fetch reconciliation run" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      run,
      message: run.sra_compliant
        ? "Reconciliation complete - SRA compliant"
        : "Reconciliation complete - review required",
    });
  } catch (error) {
    console.error("Run reconciliation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
