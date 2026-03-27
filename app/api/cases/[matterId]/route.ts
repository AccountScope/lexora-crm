import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCaseById, updateCase, archiveCase } from "@/lib/api/cases";
import { updateCaseSchema } from "@/lib/api/validation";
import { handleApiError, success } from "@/lib/api/response";

export async function GET(request: NextRequest, context: { params: { matterId: string } }) {
  try {
    await requireUser(request);
    const data = await getCaseById(context.params.matterId);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: { matterId: string } }) {
  try {
    await requireUser(request);
    const json = await request.json();
    const payload = updateCaseSchema.parse(json);
    const updated = await updateCase(context.params.matterId, payload);
    return success({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: { matterId: string } }) {
  try {
    const user = await requireUser(request);
    await archiveCase(context.params.matterId, user.id);
    return success({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
