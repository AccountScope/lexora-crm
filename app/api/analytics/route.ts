import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, success } from "@/lib/api/response";
import { getDashboardAnalytics } from "@/lib/api/analytics";

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const data = await getDashboardAnalytics();
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
