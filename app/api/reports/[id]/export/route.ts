import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api/response";
import { runReport, getReportDetail } from "@/lib/reports/builder";
import { exportReportResult } from "@/lib/reports/export";
import type { ExportFormat } from "@/lib/reports/export";
import type { ReportConfig } from "@/types";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const format: ExportFormat = body.format ?? "excel";
    if (params.id === "adhoc") {
      const config = body.config as ReportConfig;
      const result = await runReport(config, { limit: body.limit ?? 500 });
      const exportPayload = await exportReportResult(format, { name: body.name ?? "LEXORA Report", result });
      return new Response(exportPayload.buffer, {
        headers: {
          "Content-Type": exportPayload.contentType,
          "Content-Disposition": `attachment; filename="report.${exportPayload.extension}"`,
        },
      });
    }
    const detail = await getReportDetail(params.id, user.id);
    const overrides = body.overrides as Partial<ReportConfig> | undefined;
    const mergedConfig: ReportConfig = { ...detail.config, ...overrides, filters: overrides?.filters ?? detail.config.filters };
    const result = await runReport(mergedConfig, { limit: overrides?.limit ?? 500 });
    const exportPayload = await exportReportResult(format, { name: detail.name, result });
    return new Response(exportPayload.buffer, {
      headers: {
        "Content-Type": exportPayload.contentType,
        "Content-Disposition": `attachment; filename="${detail.name.replace(/[^a-z0-9_-]/gi, "_").toLowerCase()}.${exportPayload.extension}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
