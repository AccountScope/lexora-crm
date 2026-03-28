import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, success } from "@/lib/api/response";
import { addTeamMembers, removeTeamMember } from "@/lib/admin/teams";
import { ApiError } from "@/lib/api/errors";

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { userIds: string[] };
    const data = await addTeamMembers(context.params.id, body.userIds ?? [], user.id);
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
    const data = await removeTeamMember(context.params.id, userId);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
