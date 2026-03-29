"use client";

import { useState } from "react";
import { CaseSummaryCards } from "@/components/cases/case-summary-cards";
import { CaseFilters } from "@/components/cases/case-filters";
import { CasesTable } from "@/components/cases/cases-table";
import { useCases, useCreateCase } from "@/lib/hooks/use-cases";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import { Briefcase, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  matterNumber: z.string().min(2, "Matter number must be at least 2 characters"),
  clientId: z.string().uuid("Invalid client ID"),
  practiceArea: z.string().optional(),
  description: z.string().optional(),
});

export const CaseManagementPanel = () => {
  const [filters, setFilters] = useState<{ search?: string; status?: string }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isFetching, isError } = useCases(filters);
  const cases = data?.data ?? [];
  const mutation = useCreateCase();
  const form = useForm({ resolver: zodResolver(formSchema), defaultValues: { title: "", matterNumber: "", clientId: "" } });
  const { toast } = useToast();

  const submit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
      form.reset();
      setDialogOpen(false);
      toast({
        title: "Case created",
        description: "Your new case has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create case. Please try again.",
        variant: "destructive",
      });
    }
  });

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader
          title="Case Management"
          description="Manage all your legal matters in one place"
          action={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Matter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Matter</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={submit}>
                  <div className="space-y-2">
                    <Input placeholder="Matter title" {...form.register("title")} />
                    {form.formState.errors.title && (
                      <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input placeholder="Matter number" {...form.register("matterNumber")} />
                    {form.formState.errors.matterNumber && (
                      <p className="text-sm text-destructive">{form.formState.errors.matterNumber.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input placeholder="Client ID" {...form.register("clientId")} />
                    {form.formState.errors.clientId && (
                      <p className="text-sm text-destructive">{form.formState.errors.clientId.message}</p>
                    )}
                  </div>
                  <Input placeholder="Practice area (optional)" {...form.register("practiceArea" as any)} />
                  <Textarea placeholder="Description (optional)" {...form.register("description" as any)} />
                  <Button type="submit" disabled={mutation.isPending} className="w-full">
                    {mutation.isPending ? "Creating..." : "Create Matter"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          }
        />
        
        <CaseFilters onChange={setFilters} />
        
        {isFetching ? (
          <TableSkeleton rows={8} />
        ) : cases.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No cases yet"
            description="Get started by creating your first case. Track matters, clients, and deadlines all in one place."
            action={{
              label: "Create your first case",
              onClick: () => setDialogOpen(true),
            }}
          />
        ) : (
          <>
            <CaseSummaryCards data={cases} />
            <CasesTable data={cases} loading={isFetching} />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};
