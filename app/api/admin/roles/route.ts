import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, success } from "@/lib/api/response";
import { createRole, listRoles, type RolePayload } from "@/lib/admin/roles";

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const data = await listRoles();
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireUser(request);
    const payload = (await request.json()) as RolePayload;
    const data = await createRole(payload);
    return success({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
