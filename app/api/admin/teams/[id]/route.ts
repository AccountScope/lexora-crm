import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, success } from "@/lib/api/response";
import { deleteTeam, getTeamById, type TeamPayload, updateTeam } from "@/lib/admin/teams";

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireUser(request);
    const data = await getTeamById(context.params.id);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireUser(request);
    const payload = (await request.json()) as TeamPayload;
    const data = await updateTeam(context.params.id, payload);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireUser(request);
    await deleteTeam(context.params.id);
    return success({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
