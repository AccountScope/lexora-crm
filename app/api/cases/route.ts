import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { listCases, createCase } from "@/lib/api/cases";
import { createCaseSchema } from "@/lib/api/validation";
import { handleApiError, success } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "20");

    const data = await listCases({
      search,
      status,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return success({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const json = await request.json();
    const payload = createCaseSchema.parse(json);
    const created = await createCase(payload, user.id);
    return success({ data: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
