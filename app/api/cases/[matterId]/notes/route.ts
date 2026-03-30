import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getOrganizationContext } from "@/lib/api/tenant";
import { addCaseNote, listCaseNotes } from "@/lib/api/cases";
import { caseNoteSchema } from "@/lib/api/validation";
import { handleApiError, success } from "@/lib/api/response";

export async function GET(request: NextRequest, context: { params: { matterId: string } }) {
  try {
    const user = await requireUser(request);
    const orgContext = await getOrganizationContext(user.id);
    const data = await listCaseNotes(orgContext.organizationId, context.params.matterId);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: { params: { matterId: string } }) {
  try {
    const user = await requireUser(request);
    const orgContext = await getOrganizationContext(user.id);
    const body = await request.json();
    const payload = caseNoteSchema.parse({ ...body, matterId: context.params.matterId });
    const data = await addCaseNote(orgContext.organizationId, payload, user.id);
    return success({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
