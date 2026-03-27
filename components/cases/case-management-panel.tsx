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

const formSchema = z.object({
  title: z.string().min(3),
  matterNumber: z.string().min(2),
  clientId: z.string().uuid(),
  practiceArea: z.string().optional(),
  description: z.string().optional(),
});

export const CaseManagementPanel = () => {
  const [filters, setFilters] = useState<{ search?: string; status?: string }>({});
  const { data, isFetching } = useCases(filters);
  const cases = data?.data ?? [];
  const mutation = useCreateCase();
  const form = useForm({ resolver: zodResolver(formSchema), defaultValues: { title: "", matterNumber: "", clientId: "" } });

  const submit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
    form.reset();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Case management</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create matter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New matter</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={submit}>
              <Input placeholder="Matter title" {...form.register("title")} />
              <Input placeholder="Matter number" {...form.register("matterNumber")} />
              <Input placeholder="Client ID" {...form.register("clientId")} />
              <Input placeholder="Practice area" {...form.register("practiceArea")} />
              <Textarea placeholder="Description" {...form.register("description")} />
              <Button type="submit" disabled={mutation.isLoading}>
                Create
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <CaseFilters onChange={setFilters} />
      <CaseSummaryCards data={cases} />
      <CasesTable data={cases} loading={isFetching} />
    </div>
  );
};
