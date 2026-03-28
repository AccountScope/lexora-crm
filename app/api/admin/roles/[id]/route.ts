import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, success } from "@/lib/api/response";
import { deleteRole, getRoleById, type RolePayload, updateRole } from "@/lib/admin/roles";

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireUser(request);
    const data = await getRoleById(context.params.id);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireUser(request);
    const payload = (await request.json()) as RolePayload;
    const data = await updateRole(context.params.id, payload);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireUser(request);
    await deleteRole(context.params.id);
    return success({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
