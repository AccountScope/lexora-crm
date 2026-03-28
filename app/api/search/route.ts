import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, success } from "@/lib/api/response";
import { performGlobalSearch, SearchEntityType } from "@/lib/api/search";

const ALLOWED_TYPES: SearchEntityType[] = ["case", "document", "client", "time_entry", "user"];

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term") ?? "";
    const status = searchParams.get("status") ?? undefined;
    const dateFrom = searchParams.get("from") ?? undefined;
    const dateTo = searchParams.get("to") ?? undefined;
    const limitParam = Number(searchParams.get("limit") ?? "5");
    const typeParam = searchParams.get("types");

    const types = typeParam
      ? typeParam
          .split(",")
          .map((value) => value.trim())
          .filter((value): value is SearchEntityType => ALLOWED_TYPES.includes(value as SearchEntityType))
      : undefined;

    const data = await performGlobalSearch({
      term,
      types,
      status,
      dateFrom,
      dateTo,
      limitPerType: Number.isNaN(limitParam) ? undefined : limitParam,
    });

    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
