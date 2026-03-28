"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CaseSummary, TimeEntry } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LineItemState {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  timeEntryId?: string;
}

interface InvoiceGeneratorProps {
  timeEntries: TimeEntry[];
  matters: CaseSummary[];
  onGenerate: (payload: any) => Promise<void>;
  generating?: boolean;
}

const randomId = () => (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const emptyLineItem = (): LineItemState => ({
  id: randomId(),
  description: "",
  quantity: 1,
  unitPrice: 0,
  discountPercent: 0,
});

export const InvoiceGenerator = ({ timeEntries, matters, onGenerate, generating }: InvoiceGeneratorProps) => {
  const [manualLineItems, setManualLineItems] = useState<LineItemState[]>([emptyLineItem()]);
  const [selectedEntries, setSelectedEntries] = useState<Record<string, boolean>>({});

  const invoiceForm = useForm({
    defaultValues: {
      clientId: "",
      matterId: "",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      taxRate: 20,
      discountPercent: 0,
      notes: "",
      sendEmail: true,
      emailRecipients: "",
    },
  });

  const clients = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    matters.forEach((matter) => map.set(matter.client.id, { id: matter.client.id, label: matter.client.displayName ?? matter.client.legalName }));
    return Array.from(map.values());
  }, [matters]);

  const selectedTimeEntries = timeEntries.filter((entry: any) => selectedEntries[entry.id]);
  const combinedLineItems: LineItemState[] = [
    ...selectedTimeEntries.map((entry: any) => ({
      id: entry.id,
      description: entry.description,
      quantity: Number(entry.hours ?? 1),
      unitPrice: Number(entry.hourlyRate ?? 0),
      timeEntryId: entry.id,
      discountPercent: 0,
    })),
    ...manualLineItems,
  ];

  const subtotal = combinedLineItems.reduce((sum, line) => {
    const base = line.quantity * line.unitPrice;
    const discount = base * ((line.discountPercent ?? 0) / 100);
    return sum + (base - discount);
  }, 0);
  const invoiceDiscount = subtotal * ((Number(invoiceForm.watch("discountPercent")) ?? 0) / 100);
  const taxable = subtotal - invoiceDiscount;
  const taxAmount = taxable * ((Number(invoiceForm.watch("taxRate")) ?? 0) / 100);
  const total = taxable + taxAmount;

  const clientMatters = invoiceForm.watch("clientId")
    ? matters.filter((matter) => matter.client.id === invoiceForm.watch("clientId"))
    : matters;

  const toggleEntry = (entryId: string) => {
    setSelectedEntries((current) => ({ ...current, [entryId]: !current[entryId] }));
  };

  const updateManualLineItem = (id: string, key: keyof LineItemState, value: any) => {
    setManualLineItems((items) => items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const addManualLine = () => setManualLineItems((items) => [...items, emptyLineItem()]);

  const removeManualLine = (id: string) => setManualLineItems((items) => items.filter((item) => item.id !== id));

  const handleGeneratePdf = () => {
    const client = clients.find((c) => c.id === invoiceForm.watch("clientId"));
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("LEXORA LLP", 14, 20);
    doc.setFontSize(11);
    doc.text(`Invoice date: ${invoiceForm.watch("issueDate")}`, 14, 30);
    if (client) {
      doc.text(`Bill to: ${client.label}`, 14, 38);
    }

    const rows = combinedLineItems.map((line) => [
      line.description || "(No description)",
      line.quantity.toFixed(2),
      `£${line.unitPrice.toFixed(2)}`,
      `${line.discountPercent ?? 0}%`,
      `£${(line.quantity * line.unitPrice).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 48,
      head: [["Description", "Qty", "Rate", "Disc", "Amount"]],
      body: rows,
    });

    const summaryY = (doc as any).lastAutoTable?.finalY ?? 80;
    doc.text(`Subtotal: £${subtotal.toFixed(2)}`, 14, summaryY + 10);
    doc.text(`Discount: £${invoiceDiscount.toFixed(2)}`, 14, summaryY + 18);
    doc.text(`Tax (${invoiceForm.watch("taxRate")}%): £${taxAmount.toFixed(2)}`, 14, summaryY + 26);
    doc.setFontSize(14);
    doc.text(`Total: £${total.toFixed(2)}`, 14, summaryY + 36);

    doc.save(`invoice-${Date.now()}.pdf`);
  };

  const submitInvoice = async () => {
    const payload = {
      clientId: invoiceForm.getValues("clientId"),
      matterId: invoiceForm.getValues("matterId") || null,
      issueDate: invoiceForm.getValues("issueDate"),
      dueDate: invoiceForm.getValues("dueDate") || null,
      taxRate: Number(invoiceForm.getValues("taxRate")) ?? 0,
      discountPercent: Number(invoiceForm.getValues("discountPercent")) ?? 0,
      notes: invoiceForm.getValues("notes"),
      sendEmail: invoiceForm.getValues("sendEmail"),
      emailRecipients: invoiceForm
        .getValues("emailRecipients")
        ?.split(",")
        .map((email) => email.trim())
        .filter(Boolean),
      lineItems: combinedLineItems.map((line) => ({
        timeEntryId: line.timeEntryId,
        description: line.description?.trim() || "Professional services",
        quantity: line.quantity || 1,
        unitPrice: line.unitPrice,
        discountPercent: line.discountPercent ?? 0,
      })),
    };
    await onGenerate(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice generator</CardTitle>
        <CardDescription>Convert unbilled time into branded invoices with PDF + email delivery.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Client</Label>
            <Select
              value={invoiceForm.watch("clientId")}
              onValueChange={(value) => {
                invoiceForm.setValue("clientId", value);
                invoiceForm.setValue("matterId", "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Matter</Label>
            <Select value={invoiceForm.watch("matterId")} onValueChange={(value) => invoiceForm.setValue("matterId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {clientMatters.map((matter) => (
                  <SelectItem key={matter.id} value={matter.id}>
                    {matter.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Issue date</Label>
            <Input type="date" value={invoiceForm.watch("issueDate")} onChange={(event) => invoiceForm.setValue("issueDate", event.target.value)} />
          </div>
          <div>
            <Label>Due date</Label>
            <Input type="date" value={invoiceForm.watch("dueDate") ?? ""} onChange={(event) => invoiceForm.setValue("dueDate", event.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Tax rate (%)</Label>
            <Input type="number" step="0.5" value={invoiceForm.watch("taxRate")} onChange={(event) => invoiceForm.setValue("taxRate", Number(event.target.value))} />
          </div>
          <div>
            <Label>Discount (%)</Label>
            <Input type="number" step="0.5" value={invoiceForm.watch("discountPercent")} onChange={(event) => invoiceForm.setValue("discountPercent", Number(event.target.value))} />
          </div>
          <div>
            <Label>Send to</Label>
            <Input placeholder="billing@client.com" value={invoiceForm.watch("emailRecipients") ?? ""} onChange={(event) => invoiceForm.setValue("emailRecipients", event.target.value)} />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Include unbilled time</Label>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {timeEntries.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">{entry.matter.title}</p>
                  <p className="text-xs text-muted-foreground">{entry.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">£{entry.amount.toFixed(2)}</div>
                  <Button variant={selectedEntries[entry.id] ? "secondary" : "outline"} size="sm" onClick={() => toggleEntry(entry.id)}>
                    {selectedEntries[entry.id] ? "Included" : "Add"}
                  </Button>
                </div>
              </div>
            ))}
            {!timeEntries.length && <p className="text-sm text-muted-foreground">No unbilled entries available.</p>}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Manual line items</Label>
          <div className="space-y-3">
            {manualLineItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="grid gap-3 md:grid-cols-5 md:items-center">
                  <Textarea
                    className="md:col-span-2"
                    placeholder="Description"
                    value={item.description}
                    onChange={(event) => updateManualLineItem(item.id, "description", event.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={item.quantity}
                    onChange={(event) => updateManualLineItem(item.id, "quantity", Number(event.target.value))}
                  />
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={item.unitPrice}
                    onChange={(event) => updateManualLineItem(item.id, "unitPrice", Number(event.target.value))}
                  />
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={item.discountPercent ?? 0}
                    onChange={(event) => updateManualLineItem(item.id, "discountPercent", Number(event.target.value))}
                  />
                  <Button variant="ghost" type="button" onClick={() => removeManualLine(item.id)}>
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={addManualLine}>
              Add manual line
            </Button>
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea rows={3} placeholder="Payment terms, bank info, etc." value={invoiceForm.watch("notes") ?? ""} onChange={(event) => invoiceForm.setValue("notes", event.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={invoiceForm.watch("sendEmail") ?? true} onCheckedChange={(value) => invoiceForm.setValue("sendEmail", value)} />
          <Label>Send invoice email to client</Label>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground">Total due</p>
              <p className="text-3xl font-semibold">£{total.toFixed(2)}</p>
              <div className="text-xs text-muted-foreground">Subtotal £{subtotal.toFixed(2)} · Tax £{taxAmount.toFixed(2)}</div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleGeneratePdf}>
                PDF preview
              </Button>
              <Button type="button" onClick={submitInvoice} disabled={generating || !combinedLineItems.length || !invoiceForm.watch("clientId")}> 
                Issue invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
