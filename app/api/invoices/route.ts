import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, success } from "@/lib/api/response";
import { listInvoicesWithMetrics, createInvoice } from "@/lib/api/billing";
import { createInvoiceSchema } from "@/lib/api/validation";

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? "50");
    const offset = Number(searchParams.get("offset") ?? "0");

    const data = await listInvoicesWithMetrics({ status, limit, offset });
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const json = await request.json();
    const payload = createInvoiceSchema.parse(json);
    const invoice = await createInvoice(payload, user.id);
    return success({ data: invoice }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
