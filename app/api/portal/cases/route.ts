import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { listClientPortalCases } from "@/lib/api/portal";
import { handleApiError, success } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const data = await listClientPortalCases(user.id);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
