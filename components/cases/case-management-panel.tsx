"use client";

import { useState } from "react";
import { CaseSummaryCards } from "@/components/cases/case-summary-cards";
import { MatterFilters } from "@/components/cases/matter-filters";
import { MatterCard } from "@/components/cases/matter-card";
import { CasesTablePremium } from "@/components/cases/cases-table-premium";
import { useCases, useCreateCase } from "@/lib/hooks/use-cases";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBoundary } from "@/components/error-boundary";
import { Briefcase, Plus, Grid3x3, List, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MattersListSkeleton } from "@/components/ui/skeletons";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  matterNumber: z.string().min(2, "Matter number must be at least 2 characters"),
  clientName: z.string().min(2, "Client name required"),
  practiceArea: z.string().optional(),
  description: z.string().optional(),
});

export const CaseManagementPanel = () => {
  const [filters, setFilters] = useState<{ search?: string; status?: string }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const { data, isFetching, isError } = useCases(filters);
  const cases = data?.data ?? [];
  const mutation = useCreateCase();
  const form = useForm({ resolver: zodResolver(formSchema), defaultValues: { title: "", matterNumber: "", clientName: "" } });
  const { toast } = useToast();

  const submit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
      form.reset();
      setDialogOpen(false);
      toast({
        title: "Matter created",
        description: "Your new matter has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create matter. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mock data for demo
  const mockCases = cases.length > 0 ? cases : [
    {
      id: "1",
      title: "Smith vs. Johnson Employment Dispute",
      matter_number: "2024-EMP-001",
      status: "active",
      practice_area: "Employment",
      client_name: "Tech Innovations Ltd",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      fee_estimate: 8500,
      assigned_to: ["Sarah Mitchell", "James Wilson"],
    },
    {
      id: "2",
      title: "Williams Family Property Purchase",
      matter_number: "2024-RE-045",
      status: "active",
      practice_area: "Real Estate",
      client_name: "John & Sarah Williams",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      fee_estimate: 1500,
      assigned_to: ["Emma Thompson"],
    },
    {
      id: "3",
      title: "Acme Corp Acquisition Review",
      matter_number: "2024-CORP-012",
      status: "pending",
      practice_area: "Corporate",
      client_name: "Acme Corporation",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      fee_estimate: 25000,
      assigned_to: ["Sarah Mitchell", "David Chen", "James Wilson"],
    },
  ];

  const displayCases = mockCases;

  return (
    <ErrorBoundary>
      <div className="space-y-6 page-transition">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Matters</h1>
            <p className="text-muted-foreground mt-1">
              Manage all your legal matters in one place
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList>
                <TabsTrigger value="cards" className="gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Cards</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Table</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button variant="outline" size="sm" className="hidden md:flex gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Matter</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Matter</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={submit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Matter Title</label>
                    <Input placeholder="e.g., Smith vs. Johnson" {...form.register("title")} />
                    {form.formState.errors.title && (
                      <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Matter Number</label>
                    <Input placeholder="e.g., 2024-EMP-001" {...form.register("matterNumber")} />
                    {form.formState.errors.matterNumber && (
                      <p className="text-sm text-destructive">{form.formState.errors.matterNumber.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client Name</label>
                    <Input placeholder="e.g., Acme Corporation" {...form.register("clientName")} />
                    {form.formState.errors.clientName && (
                      <p className="text-sm text-destructive">{form.formState.errors.clientName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Practice Area (Optional)</label>
                    <Input placeholder="e.g., Employment, Corporate" {...form.register("practiceArea" as any)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Textarea
                      placeholder="Brief description of the matter..."
                      {...form.register("description" as any)}
                      rows={4}
                    />
                  </div>
                  <Button type="submit" disabled={mutation.isPending} className="w-full">
                    {mutation.isPending ? "Creating..." : "Create Matter"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Summary Cards */}
        <CaseSummaryCards data={displayCases as any} />
        
        {/* Filters */}
        <MatterFilters onFilterChange={setFilters} />
        
        {/* Content */}
        {isFetching ? (
          <MattersListSkeleton />
        ) : displayCases.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No matters yet"
            description="Get started by creating your first matter. Track cases, clients, and deadlines all in one place."
            action={{
              label: "Create your first matter",
              onClick: () => setDialogOpen(true),
            }}
            tips={[
              "Assign unique matter numbers for easy tracking",
              "Add practice area for better organization",
              "Include detailed descriptions for clarity",
            ]}
          />
        ) : (
          <>
            {viewMode === "cards" ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {displayCases.map((matter) => (
                  <MatterCard
                    key={matter.id}
                    matter={matter as any}
                    onLogTime={(id) => console.log("Log time for", id)}
                    onUploadDoc={(id) => console.log("Upload doc for", id)}
                    onSendMessage={(id) => console.log("Send message for", id)}
                  />
                ))}
              </div>
            ) : (
              <CasesTablePremium data={displayCases as any} loading={isFetching} onCreateMatter={() => setDialogOpen(true)} />
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};
