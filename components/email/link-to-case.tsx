'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

type Case = {
  id: string;
  case_number: string;
  case_title: string;
  client_name: string;
};

type LinkToCaseDialogProps = {
  emailId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked: () => void;
};

export function LinkToCaseDialog({
  emailId,
  open,
  onOpenChange,
  onLinked,
}: LinkToCaseDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');

  const { data: cases, isLoading } = useQuery<Case[]>({
    queryKey: ['cases', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      
      const res = await fetch(`/api/cases?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch cases');
      const json = await res.json();
      return json.data || [];
    },
    enabled: open,
  });

  const linkMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const res = await fetch(`/api/email/${emailId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      });
      if (!res.ok) throw new Error('Failed to link email');
      return res.json();
    },
    onSuccess: () => {
      onLinked();
      setSelectedCaseId('');
      setSearch('');
    },
  });

  const handleLink = () => {
    if (selectedCaseId) {
      linkMutation.mutate(selectedCaseId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Link Email to Case</DialogTitle>
          <DialogDescription>
            Search for and select a case to link this email to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="case-search">Search Cases</Label>
            <div className="flex gap-2">
              <Input
                id="case-search"
                placeholder="Search by case number, title, or client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Case Selection */}
          <div className="space-y-2">
            <Label htmlFor="case-select">Select Case</Label>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading cases...</div>
            ) : cases && cases.length > 0 ? (
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                <SelectTrigger id="case-select">
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.case_number} - {c.case_title} ({c.client_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground">
                {search ? 'No cases found' : 'Start typing to search for cases'}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedCaseId || linkMutation.isPending}
          >
            {linkMutation.isPending ? 'Linking...' : 'Link to Case'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
