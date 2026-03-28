import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, success } from "@/lib/api/response";
import { listActivities } from "@/lib/activity/logger";
import type { ActivityCategory } from "@/types";

const normalizeTypes = (value?: string | null): ActivityCategory[] | undefined => {
  if (!value) return undefined;
  const list = value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean) as ActivityCategory[];
  return list.length ? list : undefined;
};

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Number(searchParams.get("limit") ?? "30");
    const result = await listActivities(
      {
        types: normalizeTypes(searchParams.get("types")),
        userId: searchParams.get("userId") ?? undefined,
        caseId: searchParams.get("caseId") ?? undefined,
        documentId: searchParams.get("documentId") ?? undefined,
        search: searchParams.get("q") ?? undefined,
        from: searchParams.get("from") ?? undefined,
        to: searchParams.get("to") ?? undefined,
      },
      {
        limit,
        cursor,
      }
    );

    return success({ data: result.data, meta: { nextCursor: result.nextCursor } });
  } catch (error) {
    return handleApiError(error);
  }
}
