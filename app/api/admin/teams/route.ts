import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, success } from "@/lib/api/response";
import { createTeam, listTeams, type TeamPayload } from "@/lib/admin/teams";

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const data = await listTeams();
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const payload = (await request.json()) as TeamPayload;
    const data = await createTeam(payload, user.id);
    return success({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
