import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";
import { handleApiError, success } from "@/lib/api/response";
import {
  applyUserBulkAction,
  fetchAssignableRoles,
  getAdminUserById,
  getAdminUserMetrics,
  listAdminUsers,
  markUserVerified,
  updateAdminUserProfile,
  issueAdminPasswordReset,
} from "@/lib/admin/users";

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
    const scope = searchParams.get("scope") ?? "list";
    if (scope === "metrics") {
      const data = await getAdminUserMetrics();
      return success({ data });
    }
    if (scope === "roles") {
      const data = await fetchAssignableRoles();
      return success({ data });
    }
    if (scope === "detail") {
      const userId = searchParams.get("userId");
      if (!userId) throw new ApiError(400, "userId is required");
      const data = await getAdminUserById(userId);
      return success({ data });
    }
    const verifiedParam = searchParams.get("verified");
    const sortDirParam = searchParams.get("sortDirection");
    
    const data = await listAdminUsers({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      roleId: searchParams.get("roleId") ?? undefined,
      verified: (verifiedParam === "true" || verifiedParam === "false") ? verifiedParam as "true" | "false" : undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortDirection: (sortDirParam === "asc" || sortDirParam === "desc") ? sortDirParam as "asc" | "desc" : undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
    });
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await ensureAdmin(request);
    const payload = await request.json();
    const userId = payload.userId as string | undefined;
    if (!userId) {
      throw new ApiError(400, "userId is required");
    }
    const data = await updateAdminUserProfile(userId, {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone ?? null,
      status: payload.status ?? undefined,
      roleId: payload.roleId ?? undefined,
    }, actor.id);
    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await ensureAdmin(request);
    const payload = await request.json();
    const action = payload.action;
    if (!action) {
      throw new ApiError(400, "Action is required");
    }
    switch (action) {
      case "bulk-activate":
        await applyUserBulkAction("activate", payload.userIds ?? [], actor.id);
        return success({ ok: true });
      case "bulk-deactivate":
        await applyUserBulkAction("deactivate", payload.userIds ?? [], actor.id);
        return success({ ok: true });
      case "bulk-delete":
        await applyUserBulkAction("delete", payload.userIds ?? [], actor.id);
        return success({ ok: true });
      case "verify":
        await markUserVerified(payload.userId, actor.id);
        return success({ ok: true });
      case "reset-password":
        await issueAdminPasswordReset(payload.userId, actor.id);
        return success({ ok: true });
      default:
        throw new ApiError(400, "Unsupported action");
    }
  } catch (error) {
    return handleApiError(error);
  }
}
