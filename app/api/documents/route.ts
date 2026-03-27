import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { listDocuments } from "@/lib/api/documents";
import { handleApiError, success } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const { searchParams } = new URL(request.url);
    const matterId = searchParams.get("matterId") ?? undefined;
    const clientId = searchParams.get("clientId") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const data = await listDocuments({ matterId: matterId ?? undefined, clientId, search });
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
