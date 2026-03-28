import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { success, handleApiError } from "@/lib/api/response";
import {
  getReportDetail,
  runReport,
  updateReport,
  deleteReport,
  createSchedule,
  updateSchedule,
  toggleSchedule,
  deleteSchedule,
} from "@/lib/reports/builder";
import { getPrebuiltReport } from "@/lib/reports/prebuilt";
import type { ReportConfig } from "@/types";

const isPrebuilt = (id: string) => Boolean(getPrebuiltReport(id));

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request);
    const run = new URL(request.url).searchParams.get("run") === "1";
    const report = await getReportDetail(params.id, user.id);
    const result = run ? await runReport(report.config) : undefined;
    return success({ data: { report, result } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request);
    if (isPrebuilt(params.id)) {
      throw new ApiError(400, "Pre-built reports cannot be modified");
    }
    const payload = await request.json();
    const updated = await updateReport(params.id, payload, user.id);
    return success({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request);
    if (isPrebuilt(params.id)) {
      throw new ApiError(400, "Pre-built reports cannot be deleted");
    }
    await deleteReport(params.id, user.id);
    return success({ data: { ok: true } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const action: string = body.action ?? "run";
    const scheduleMutation = action.startsWith("schedule");
    if (scheduleMutation && isPrebuilt(params.id)) {
      throw new ApiError(400, "Schedules require a saved report");
    }
    if (action === "run") {
      const detail = await getReportDetail(params.id, user.id);
      const overrides = body.overrides as Partial<ReportConfig> | undefined;
      const mergedConfig: ReportConfig = { ...detail.config, ...overrides, filters: overrides?.filters ?? detail.config.filters };
      const result = await runReport(mergedConfig, { limit: overrides?.limit });
      return success({ data: result });
    }
    if (action === "schedule:add") {
      const schedule = await createSchedule(params.id, body.payload, user.id);
      return success({ data: schedule });
    }
    if (action === "schedule:update") {
      const schedule = await updateSchedule(body.scheduleId, body.payload, user.id);
      return success({ data: schedule });
    }
    if (action === "schedule:toggle") {
      await toggleSchedule(body.scheduleId, Boolean(body.enabled), user.id);
      return success({ data: { ok: true } });
    }
    if (action === "schedule:delete") {
      await deleteSchedule(body.scheduleId, user.id);
      return success({ data: { ok: true } });
    }
    return success({ data: { ok: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
