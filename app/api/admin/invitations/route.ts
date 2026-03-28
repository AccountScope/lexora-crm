import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";
import { handleApiError, success } from "@/lib/api/response";
import {
  createInvitations,
  listInvitations,
  resendInvitation,
  cancelInvitation,
  InvitationCreateInput,
} from "@/lib/admin/invitations";

const ensureAdmin = async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user.role !== "admin") {
    throw new ApiError(403, "Administrator privileges required");
  }
  return user;
};

export async function GET(request: NextRequest) {
  try {
    await ensureAdmin(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
    const pageSize = searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined;
    const data = await listInvitations({ status, search, page, pageSize });
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await ensureAdmin(request);
    const body = await request.json();
    const invites = (body.invites ?? []) as InvitationCreateInput[];
    if (!invites.length) {
      throw new ApiError(400, "No invitations supplied");
    }
    const data = await createInvitations(invites, actor.id);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await ensureAdmin(request);
    const body = await request.json();
    switch (body.action) {
      case "resend": {
        const data = await resendInvitation(body.invitationId, actor.id);
        return success({ data });
      }
      case "cancel": {
        await cancelInvitation(body.invitationId, actor.id);
        return success({ ok: true });
      }
      default:
        throw new ApiError(400, "Unknown invitation action");
    }
  } catch (error) {
    return handleApiError(error);
  }
}
