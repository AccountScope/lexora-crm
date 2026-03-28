import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { listConflictChecks } from "@/lib/api/conflicts";
import { handleApiError, success } from "@/lib/api/response";
import type { ConflictStatus } from "@/types";

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const statusParam = searchParams.get("status");
    const allowedStatuses: ConflictStatus[] = ["pending", "accepted", "waived", "rejected", "escalated"];
    const status = allowedStatuses.includes(statusParam as ConflictStatus) ? (statusParam as ConflictStatus) : undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "20");

    const { data, total } = await listConflictChecks({
      search,
      status,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return success({ data, meta: { page, pageSize, total } });
  } catch (error) {
    return handleApiError(error);
  }
}
