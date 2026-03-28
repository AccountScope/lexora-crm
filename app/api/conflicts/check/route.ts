import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { conflictCheckSchema } from "@/lib/api/validation";
import { runConflictCheck } from "@/lib/conflicts/checker";
import { handleApiError, success } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const json = await request.json();
    const payload = conflictCheckSchema.parse(json);
    const result = await runConflictCheck({ ...payload, requestedBy: user.id });
    return success({ data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
