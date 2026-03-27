import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { addCaseNote, listCaseNotes } from "@/lib/api/cases";
import { caseNoteSchema } from "@/lib/api/validation";
import { handleApiError, success } from "@/lib/api/response";

export async function GET(request: NextRequest, context: { params: { matterId: string } }) {
  try {
    await requireUser(request);
    const data = await listCaseNotes(context.params.matterId);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: { params: { matterId: string } }) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const payload = caseNoteSchema.parse({ ...body, matterId: context.params.matterId });
    const data = await addCaseNote(payload, user.id);
    return success({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
