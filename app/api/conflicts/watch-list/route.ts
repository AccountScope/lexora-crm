import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, success } from "@/lib/api/response";
import { watchListEntrySchema } from "@/lib/api/validation";
import { addWatchListEntry, listWatchListEntries, removeWatchListEntry } from "@/lib/api/conflicts";
import { ApiError } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const data = await listWatchListEntries();
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const json = await request.json();
    const payload = watchListEntrySchema.parse(json);
    const entry = await addWatchListEntry(payload.partyName, payload.reason, user.id);
    return success({ data: entry }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireUser(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      throw new ApiError(400, "Watch list entry id is required");
    }
    await removeWatchListEntry(id);
    return success({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
