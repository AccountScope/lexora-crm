import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, success } from "@/lib/api/response";
import { addUsersToRole, removeUserFromRole } from "@/lib/admin/roles";
import { ApiError } from "@/lib/api/errors";

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireUser(request);
    const body = (await request.json()) as { userIds: string[] };
    const data = await addUsersToRole(context.params.id, body.userIds ?? []);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireUser(request);
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      throw new ApiError(400, "Missing userId");
    }
    const data = await removeUserFromRole(context.params.id, userId);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
