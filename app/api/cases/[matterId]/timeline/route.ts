import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getOrganizationContext } from "@/lib/api/tenant";
import { getCaseTimeline } from "@/lib/api/cases";
import { handleApiError, success } from "@/lib/api/response";

export async function GET(request: NextRequest, context: { params: { matterId: string } }) {
  try {
    const user = await requireUser(request);
    const orgContext = await getOrganizationContext(user.id);
    const data = await getCaseTimeline(orgContext.organizationId, context.params.matterId);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
