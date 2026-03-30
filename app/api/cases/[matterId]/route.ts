import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getOrganizationContext } from "@/lib/api/tenant";
import { getCaseById, updateCase, archiveCase } from "@/lib/api/cases";
import { updateCaseSchema } from "@/lib/api/validation";
import { handleApiError, success } from "@/lib/api/response";

export async function GET(request: NextRequest, context: { params: { matterId: string } }) {
  try {
    const user = await requireUser(request);
    const orgContext = await getOrganizationContext(user.id);
    const data = await getCaseById(orgContext.organizationId, context.params.matterId);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: { matterId: string } }) {
  try {
    const user = await requireUser(request);
    const orgContext = await getOrganizationContext(user.id);
    const json = await request.json();
    const payload = updateCaseSchema.parse(json);
    const updated = await updateCase(orgContext.organizationId, context.params.matterId, payload);
    return success({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: { matterId: string } }) {
  try {
    const user = await requireUser(request);
    const orgContext = await getOrganizationContext(user.id);
    await archiveCase(orgContext.organizationId, context.params.matterId, user.id);
    return success({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
