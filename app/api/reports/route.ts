import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api/response";
import { runReport, listReportsForUser, createReport, reportTypeChoices, listPrebuiltReports } from "@/lib/reports/builder";
import type { ReportConfig } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const [reports] = await Promise.all([listReportsForUser(user.id)]);
    const prebuilt = listPrebuiltReports().map((report) => ({
      id: `prebuilt-${report.id}`,
      name: report.name,
      description: report.description,
      type: report.type,
      category: report.category,
    }));
    return success({ data: { reports, prebuilt, types: reportTypeChoices } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const mode = body.mode ?? "preview";
    if (mode === "preview") {
      const config = body.config as ReportConfig;
      const result = await runReport(config, { limit: 10 });
      return success({ data: result });
    }
    if (mode === "create") {
      const payload = body.payload ?? body;
      const created = await createReport(
        {
          name: payload.name,
          description: payload.description,
          type: payload.type,
          config: payload.config,
          isTemplate: payload.isTemplate ?? false,
        },
        user.id
      );
      return success({ data: created }, { status: 201 });
    }
    return success({ data: { ok: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
