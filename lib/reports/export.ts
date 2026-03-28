import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportResultPayload } from "@/types";

export type ExportFormat = "excel" | "pdf" | "csv";

interface ExportOptions {
  name: string;
  result: ReportResultPayload;
}

interface ExportResponse {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

const buildMatrix = (result: ReportResultPayload) => {
  const headers = result.columns.map((column) => column.label);
  const rows = result.rows.map((row) => result.columns.map((column) => row[column.key] ?? ""));
  return { headers, rows };
};

const exportCsv = (result: ReportResultPayload): Buffer => {
  const { headers, rows } = buildMatrix(result);
  const escape = (value: any) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))];
  return Buffer.from(lines.join("\n"), "utf8");
};

const exportExcel = async (name: string, result: ReportResultPayload): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LEXORA";
  const sheet = workbook.addWorksheet("Data");
  sheet.columns = result.columns.map((column) => ({ header: column.label, width: 20 }));
  result.rows.forEach((row) => {
    sheet.addRow(result.columns.map((column) => row[column.key]));
  });
  if (result.grouped) {
    const groupedSheet = workbook.addWorksheet("Grouped");
    groupedSheet.columns = [
      { header: result.grouped.field, width: 25 },
      { header: "Value", width: 15 },
      ...(result.grouped.rows.some((row) => row.secondary !== undefined) ? [{ header: "Secondary", width: 15 }] : []),
    ];
    result.grouped.rows.forEach((row) => {
      const values = [row.label, row.value];
      if (row.secondary !== undefined) {
// @ts-expect-error - null type
        values.push(row.secondary);
      }
      groupedSheet.addRow(values);
    });
  }
  if (result.kpis?.length) {
    const kpiSheet = workbook.addWorksheet("KPIs");
    kpiSheet.columns = [
      { header: "Metric", width: 30 },
      { header: "Value", width: 20 },
      { header: "Helper", width: 40 },
    ];
    result.kpis.forEach((card) => {
      kpiSheet.addRow([card.label, card.value, card.helper ?? ""]);
    });
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

const exportPdf = (name: string, result: ReportResultPayload): Buffer => {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.text(name, 14, 18);
  let currentY = 26;
  if (result.kpis?.length) {
    doc.setFontSize(11);
    result.kpis.forEach((card) => {
      doc.text(`${card.label}: ${card.value}${card.helper ? ` (${card.helper})` : ""}`, 14, currentY);
      currentY += 6;
    });
    currentY += 4;
  }
  const { headers, rows } = buildMatrix(result);
  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: rows,
    styles: { fontSize: 8 },
    theme: "grid",
    headStyles: { fillColor: [20, 30, 67] },
  });
  const buffer = doc.output("arraybuffer");
  return Buffer.from(buffer);
};

export const exportReportResult = async (format: ExportFormat, options: ExportOptions): Promise<ExportResponse> => {
  const { name, result } = options;
  switch (format) {
    case "excel": {
      const buffer = await exportExcel(name, result);
      return { buffer, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx" };
    }
    case "pdf": {
      const buffer = exportPdf(name, result);
      return { buffer, contentType: "application/pdf", extension: "pdf" };
    }
    case "csv":
    default: {
      const buffer = exportCsv(result);
      return { buffer, contentType: "text/csv", extension: "csv" };
    }
  }
};
