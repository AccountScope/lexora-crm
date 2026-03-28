import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  listDeadlines,
  listDeadlineTemplates,
  listUpcomingDeadlines,
  createDeadline,
  createDeadlineTemplate,
  updateDeadline,
} from "@/lib/api/deadlines";
import { deadlineInputSchema, deadlineTemplateSchema, deadlineUpdateSchema } from "@/lib/api/validation";
import { handleApiError, success } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") ?? "list";
    if (scope === "templates") {
      const templates = await listDeadlineTemplates();
      return success({ data: templates });
    }
    if (scope === "upcoming") {
      const limit = Number(searchParams.get("limit") ?? "5");
      const data = await listUpcomingDeadlines(limit);
      return success({ data });
    }
    const statuses = searchParams.getAll("status") ?? [];
    const rangeStart = searchParams.get("rangeStart") ?? undefined;
    const rangeEnd = searchParams.get("rangeEnd") ?? undefined;
    const overdueOnly = searchParams.get("overdueOnly") === "true";
    const upcomingOnly = searchParams.get("upcomingOnly") === "true";
    const limit = Number(searchParams.get("limit") ?? "200");
    const caseId = searchParams.get("caseId") ?? undefined;
    const assignedTo = searchParams.get("assignedTo") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const data = await listDeadlines({
      statuses: statuses.length ? (statuses as any) : undefined,
      rangeStart,
      rangeEnd,
      overdueOnly,
      upcomingOnly,
      limit,
      caseId,
      assignedTo,
      search,
    });
    return success({ data, meta: { count: data.length } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const json = await request.json();
    if (json?.mode === "template") {
      const payload = deadlineTemplateSchema.parse(json);
      const created = await createDeadlineTemplate(payload, user.id);
      return success({ data: created }, { status: 201 });
    }
    const payload = deadlineInputSchema.parse(json);
    const created = await createDeadline(payload, user.id);
    return success({ data: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireUser(request);
    const json = await request.json();
    const payload = deadlineUpdateSchema.parse(json);
    const updated = await updateDeadline(payload);
    return success({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
