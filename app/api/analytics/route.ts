import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getOrganizationContext } from "@/lib/api/tenant";
import { handleApiError, success } from "@/lib/api/response";
import { getDashboardAnalytics } from "@/lib/api/analytics";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const context = await getOrganizationContext(user.id);
    const data = await getDashboardAnalytics(context.organizationId);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
