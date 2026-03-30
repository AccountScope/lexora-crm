"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCreateCase } from "@/lib/hooks/use-cases";
import { Clock, FileText, CheckCircle2 } from "lucide-react";

// PHASE 2: Zero-friction form with minimal required fields
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  matterNumber: z.string().optional(), // Auto-generate if empty
  clientId: z.string().optional(), // Can be selected from dropdown
  practiceArea: z.string().optional(),
  description: z.string().optional(),
});

interface CreateMatterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMatterDialog({ open, onOpenChange }: CreateMatterDialogProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const mutation = useCreateCase();
  const form = useForm({ 
    resolver: zodResolver(formSchema), 
    defaultValues: { 
      title: "", 
      matterNumber: "", 
      clientId: "",
      practiceArea: "",
      description: ""
    } 
  });
  const { toast } = useToast();
  // PHASE 2: Autofocus on open (removed ref - using form.setFocus instead)
  useEffect(() => {
    if (open) {
      setTimeout(() => form.setFocus("title"), 100);
    }
  }, [open, form]);

  const submit = form.handleSubmit(async (values) => {
    try {
      // PHASE 1: Optimistic update happens in hook
      await mutation.mutateAsync(values);
      
      // PHASE 5: Clear success feedback
      setShowSuccess(true);
      form.reset();
      
      toast({
        title: "Matter created successfully",
        description: `"${values.title}" is ready to use`,
      });
      
      // PHASE 3: Keep dialog open for next action
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      
    } catch (error) {
      // PHASE 5: Human-readable error
      toast({
        title: "Failed to create matter",
        description: "Please check your inputs and try again. If the problem persists, contact support.",
        variant: "destructive",
      });
    }
  });

  // PHASE 2: Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Matter</DialogTitle>
        </DialogHeader>
        
        {showSuccess ? (
          // PHASE 3: Success state with next actions
          <div className="space-y-6 py-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Matter created!</h3>
                <p className="text-sm text-muted-foreground mt-1">What would you like to do next?</p>
              </div>
            </div>
            
            <div className="grid gap-3">
              <Button variant="outline" className="justify-start gap-3" onClick={() => setShowSuccess(false)}>
                <Clock className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">Log time</p>
                  <p className="text-xs text-muted-foreground">Start tracking billable hours</p>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start gap-3" onClick={() => setShowSuccess(false)}>
                <FileText className="h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">Upload document</p>
                  <p className="text-xs text-muted-foreground">Add files to this matter</p>
                </div>
              </Button>
              
              <Button variant="outline" onClick={() => { setShowSuccess(false); form.reset(); }}>
                Create another matter
              </Button>
              
              <Button onClick={() => { setShowSuccess(false); onOpenChange(false); form.reset(); }}>
                View all matters
              </Button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={submit} onKeyDown={handleKeyDown}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Matter Title *</label>
              <Input 
                placeholder="e.g., Smith vs. Johnson Employment Dispute" 
                {...form.register("title")} 
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
              <p className="text-xs text-muted-foreground">Press Enter to create</p>
            </div>
            
            {/* PHASE 2: Simplified - removed required fields */}
            <details className="rounded-lg border p-4">
              <summary className="cursor-pointer text-sm font-medium">Optional details</summary>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Matter Number</label>
                  <Input 
                    placeholder="Auto-generated if left blank" 
                    {...form.register("matterNumber")} 
                  />
                  <p className="text-xs text-muted-foreground">Leave blank to auto-generate</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Practice Area</label>
                  <Input placeholder="e.g., Employment, Corporate" {...form.register("practiceArea")} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Brief description..."
                    {...form.register("description")}
                    rows={3}
                  />
                </div>
              </div>
            </details>
            
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending || !form.formState.isValid} 
                className="flex-1 gap-2"
              >
                {mutation.isPending ? (
                  <>Creating...</>
                ) : (
                  <>Create Matter</>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
