"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReportColumn, ReportRow } from "@/types";

interface ReportTableProps {
  columns: ReportColumn[];
  rows: ReportRow[];
  isLoading?: boolean;
  title?: string;
  emptyMessage?: string;
}

export const ReportTable = ({ columns, rows, isLoading, title = "Preview", emptyMessage = "No rows yet" }: ReportTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground">
                  Loading preview…
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((row, index) => (
                <TableRow key={`${index}-${row[columns[0]?.key ?? "col"]}`}>
                  {columns.map((column) => (
                    <TableCell key={`${column.key}-${index}`}>
                      {row[column.key] === null || row[column.key] === undefined ? "—" : String(row[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
