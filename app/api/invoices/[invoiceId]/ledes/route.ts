import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateLEDES1998B,
  generateLEDES2000,
  validateLEDES,
  suggestUTBMSCode,
  type TimeEntry,
  type LEDESConfig,
} from "@/lib/billing/ledes-generator";

/**
 * LEDES Export API
 * 
 * POST /api/invoices/[invoiceId]/ledes
 * Body: {
 *   format: "1998B" | "2000",
 *   invoiceNumber: "INV-2026-001",
 *   clientId: "...",
 *   matterNumber: "..."
 * }
 * 
 * Returns: LEDES file (text or XML)
 */

export async function POST(
  req: NextRequest,
  { params }: { params: { invoiceId: string } }
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

    const { invoiceId } = params;
    const body = await req.json();
    const { format, invoiceNumber, clientId, matterNumber } = body;

    // Validate inputs
    if (!format || !["1998B", "2000"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be 1998B or 2000" },
        { status: 400 }
      );
    }

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: "Invoice number is required" },
        { status: 400 }
      );
    }

    // Fetch invoice and time entries
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        invoice_date,
        matter:cases!invoices_matter_id_fkey (
          id,
          matter_number,
          client:clients!cases_client_id_fkey (
            id,
            legal_name
          )
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Fetch time entries for this invoice
    const { data: timeEntries, error: entriesError } = await supabase
      .from("time_entries")
      .select(`
        id,
        work_date,
        hours,
        hourly_rate,
        description,
        activity_code,
        user:auth.users!time_entries_user_id_fkey (
          id,
          raw_user_meta_data
        )
      `)
      .eq("invoice_id", invoiceId)
      .order("work_date", { ascending: true });

    if (entriesError) {
      console.error("Failed to fetch time entries:", entriesError);
      return NextResponse.json(
        { error: "Failed to fetch time entries" },
        { status: 500 }
      );
    }

    if (!timeEntries || timeEntries.length === 0) {
      return NextResponse.json(
        { error: "No time entries found for this invoice" },
        { status: 400 }
      );
    }

    // Get firm details (TODO: fetch from settings)
    const firmName = "Your Law Firm"; // TODO: Get from firm settings
    const firmTaxId = "123456789"; // TODO: Get from firm settings

    // Convert to LEDES format
    const ledesEntries: TimeEntry[] = timeEntries.map((entry: any, index: number) => ({
      id: entry.id,
      date: entry.work_date,
      lawyerName: entry.user?.raw_user_meta_data?.full_name || "Unknown",
      lawyerRate: entry.hourly_rate || 0,
      hours: entry.hours,
      activityCode: entry.activity_code || suggestUTBMSCode(entry.description),
      description: entry.description,
      matterNumber: matterNumber || (invoice.matter as any)?.matter_number || "",
      invoiceNumber,
      lineNumber: index + 1,
    }));

    const config: LEDESConfig = {
      format,
      lawFirmName: firmName,
      lawFirmTaxId: firmTaxId,
      clientId: clientId || (invoice.matter as any)?.client?.id || "",
      matterNumber: matterNumber || (invoice.matter as any)?.matter_number || "",
      invoiceNumber,
      invoiceDate: invoice.invoice_date,
    };

    // Generate LEDES file
    let content: string;
    let contentType: string;
    let fileExtension: string;

    if (format === "1998B") {
      content = generateLEDES1998B(ledesEntries, config);
      contentType = "text/plain";
      fileExtension = "txt";
    } else {
      content = generateLEDES2000(ledesEntries, config);
      contentType = "application/xml";
      fileExtension = "xml";
    }

    // Validate before sending
    const validation = validateLEDES(content, format);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Generated LEDES file failed validation",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Return file as download
    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="LEDES_${format}_${invoiceNumber}.${fileExtension}"`,
      },
    });
  } catch (error) {
    console.error("LEDES export error:", error);
    return NextResponse.json(
      { error: "Failed to generate LEDES file" },
      { status: 500 }
    );
  }
}
