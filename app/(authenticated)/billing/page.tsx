"use client";

import { useMemo } from "react";
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { useCases } from "@/lib/hooks/use-cases";
import { useInvoices, useCreateInvoice, useTimeEntries } from "@/lib/hooks/use-billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InvoiceGenerator } from "@/components/billing/invoice-generator";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const BillingPage = () => {
  const { data: invoiceResponse, isFetching } = useInvoices();
  const { data: casesData } = useCases();
  const matters = casesData?.data ?? [];
  const createInvoice = useCreateInvoice();
  const { data: unbilledData } = useTimeEntries({ status: "UNBILLED", billable: true, limit: 50 });
  const unbilledEntries = unbilledData?.data.entries ?? [];

  const invoices = invoiceResponse?.data.invoices ?? [];
  const metrics = invoiceResponse?.data.metrics;

  const revenueChart = useMemo(() => {
    const labels = metrics?.monthlyRevenue.map((item: any) => item.month) ?? [];
    const data = metrics?.monthlyRevenue.map((item: any) => item.total) ?? [];
    return {
      labels,
      datasets: [
        {
          label: "Monthly revenue",
          data,
          backgroundColor: "rgba(59,130,246,0.6)",
          borderRadius: 6,
        },
      ],
    };
  }, [metrics]);

  const realizationChart = useMemo(() => {
    const rate = metrics?.realizationRate ?? 0;
    return {
      labels: ["Collected", "Outstanding"],
      datasets: [
        {
          data: [rate, Math.max(0, 100 - rate)],
          backgroundColor: ["#16a34a", "#f97316"],
        },
      ],
    };
  }, [metrics]);

  const totalUnbilled = metrics?.unbilledTimeByClient.reduce((sum: number, row: any) => sum + row.amount, 0) ?? 0;

  const handleInvoiceGenerate = async (payload: any) => {
    await createInvoice.mutateAsync(payload);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing Intelligence"
        description="Surface unbilled time, outstanding balances, and realization in one control tower"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Outstanding</CardTitle>
            <CardDescription>Across active invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">£{(metrics?.outstandingTotal ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Collected</CardTitle>
            <CardDescription>Lifetime receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">£{(metrics?.collectedAmount ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Realization</CardTitle>
            <CardDescription>Billed vs collected</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{(metrics?.realizationRate ?? 0).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unbilled time</CardTitle>
            <CardDescription>Ready to convert</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">£{totalUnbilled.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={revenueChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Realization rate</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-64 w-64">
              <Doughnut data={realizationChart} options={{ cutout: "70%" }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Unbilled by client</CardTitle>
            <CardDescription>Focus partner conversations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(metrics?.unbilledTimeByClient ?? []).map((row: any) => (
                  <TableRow key={`${row.clientId}-${row.matterId ?? "all"}`}>
                    <TableCell>{row.clientName}</TableCell>
                    <TableCell>{row.hours.toFixed(1)}</TableCell>
                    <TableCell>£{row.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {!metrics?.unbilledTimeByClient?.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      All clear—no unbilled time.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest payments</CardTitle>
            <CardDescription>Auto-updated from ledger sync.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(metrics?.payments ?? []).map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.paidOn), "dd MMM")}</TableCell>
                    <TableCell>{payment.invoiceId.slice(0, 8)}</TableCell>
                    <TableCell>£{payment.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {!metrics?.payments?.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      No payments recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding invoices</CardTitle>
          <CardDescription>{isFetching ? "Refreshing…" : `${invoices.length} invoices`}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Issue date</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.client.displayName ?? invoice.client.legalName}</TableCell>
                  <TableCell>{format(new Date(invoice.issueDate), "dd MMM yyyy")}</TableCell>
                  <TableCell>{invoice.dueDate ? format(new Date(invoice.dueDate), "dd MMM") : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === "PAID" ? "secondary" : "default"}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">£{invoice.balanceDue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {!invoices.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No invoices yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InvoiceGenerator
        timeEntries={unbilledEntries}
        matters={matters}
        onGenerate={handleInvoiceGenerate}
        generating={createInvoice.isPending}
      />
    </div>
  );
};

export default BillingPage;
