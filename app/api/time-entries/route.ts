import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getOrganizationContext } from "@/lib/api/tenant";
import { handleApiError, success } from "@/lib/api/response";
import {
  timeEntrySchema,
  bulkTimeEntrySchema,
  timeEntryTemplateSchema,
} from "@/lib/api/validation";
import {
  listTimeEntries,
  listTimeEntryTemplates,
  createTimeEntries,
  createTimeEntryTemplate,
} from "@/lib/api/billing";

const toBoolean = (value: string | null) => {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const context = await getOrganizationContext(user.id); // SECURITY FIX: Add organization context
    
    const { searchParams } = new URL(request.url);
    const filters = {
      organizationId: context.organizationId, // SECURITY FIX: Enforce organization scoping
      clientId: searchParams.get("clientId") ?? undefined,
      matterId: searchParams.get("matterId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      billable: toBoolean(searchParams.get("billable")),
      limit: Number(searchParams.get("limit") ?? "50"),
      offset: Number(searchParams.get("offset") ?? "0"),
    };

    const [entryPayload, templates] = await Promise.all([
      listTimeEntries(filters),
      listTimeEntryTemplates(user.id),
    ]);

    return success({ data: { ...entryPayload, templates } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const context = await getOrganizationContext(user.id); // SECURITY FIX: Add organization context
    const json = await request.json();

    if (json.mode === "template") {
      const payload = timeEntryTemplateSchema.parse(json);
      const template = await createTimeEntryTemplate(payload, user.id);
      return success({ data: template }, { status: 201 });
    }

    // SECURITY NOTE: Ensure entries inherit organization_id in createTimeEntries function
    if (Array.isArray(json.entries)) {
      const payload = bulkTimeEntrySchema.parse(json);
      const ids = await createTimeEntries(payload.entries, user.id, { 
        batchLabel: payload.batchLabel,
        organizationId: context.organizationId // SECURITY FIX
      });
      return success({ data: { ids } }, { status: 201 });
    }

    const payload = timeEntrySchema.parse(json);
    const ids = await createTimeEntries([payload], user.id, {
      organizationId: context.organizationId // SECURITY FIX
    });
    return success({ data: { ids } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
