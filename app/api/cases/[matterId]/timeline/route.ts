import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCaseTimeline } from "@/lib/api/cases";
import { handleApiError, success } from "@/lib/api/response";

export async function GET(request: NextRequest, context: { params: { matterId: string } }) {
  try {
    await requireUser(request);
    const data = await getCaseTimeline(context.params.matterId);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
