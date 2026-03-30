"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Eye, HelpCircle, InfoIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ReportBuilderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("cases");
  const [fields, setFields] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState("all");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          type,
          config: { fields, dateRange },
        }),
      });
      if (!res.ok) throw new Error("Failed to save report");
      return res.json();
    },
    onSuccess: (data) => {
      router.push(`/reports/${data.id}`);
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter a report name");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <PageHeader
            title="Report Builder"
            description="Create custom reports for cases, billing, time tracking, and more"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                Report tips
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <p className="font-semibold mb-2">Building Great Reports:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Start with a clear question (e.g., "Which matters are overdue?")</li>
                <li>Choose only the fields you need</li>
                <li>Use date ranges to focus on relevant data</li>
                <li>Export to CSV for further analysis in Excel</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>Basic information about your report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Report Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Active Cases by Status"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does this report show?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="type">Report Type *</Label>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Choose the primary data source for your report. This determines which fields and filters are available.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cases">Cases (matters, clients, status)</SelectItem>
                <SelectItem value="time">Time Entries (billable hours)</SelectItem>
                <SelectItem value="billing">Billing (invoices, payments)</SelectItem>
                <SelectItem value="documents">Documents (files, uploads)</SelectItem>
                <SelectItem value="users">Users (team members, roles)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateRange">Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger id="dateRange">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="365">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/reports")}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save Report"}
          </Button>
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
}
