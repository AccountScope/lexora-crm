import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  createConflictWaiver,
  getConflictCheckDetail,
  updateConflictStatus,
} from "@/lib/api/conflicts";
import { conflictStatusSchema, conflictWaiverSchema } from "@/lib/api/validation";
import { handleApiError, success } from "@/lib/api/response";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireUser(_request);
    const data = await getConflictCheckDetail(params.id);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request);
    const json = await request.json();
    const payload = conflictStatusSchema.parse(json);
    const data = await updateConflictStatus(params.id, payload, user.id);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireUser(request);
    const json = await request.json();
    const payload = conflictWaiverSchema.parse(json);
    const waiver = await createConflictWaiver(params.id, payload);
    return success({ data: waiver }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
