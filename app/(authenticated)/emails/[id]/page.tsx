'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Link2, Unlink, Reply, Forward, Download, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { LinkToCaseDialog } from '@/components/email/link-to-case';

type EmailDetail = {
  id: string;
  from_email: string;
  from_name: string | null;
  to_emails: string[];
  cc_emails: string[];
  bcc_emails: string[];
  subject: string;
  body_html: string | null;
  body_text: string | null;
  date: Date;
  case_id: string | null;
  case_number: string | null;
  has_attachments: boolean;
  attachments: Array<{
    id: string;
    filename: string;
    content_type: string | null;
    size: number | null;
  }>;
};

export default function EmailDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const emailId = params.id as string;

  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const { data: email, isLoading } = useQuery<EmailDetail>({
    queryKey: ['email', emailId],
    queryFn: async () => {
      const res = await fetch(`/api/email/${emailId}`);
      if (!res.ok) throw new Error('Failed to fetch email');
      const json = await res.json();
      return json.data;
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/email/${emailId}/link`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to unlink');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email', emailId] });
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading email...</div>;
  }

  if (!email) {
    return <div className="p-6">Email not found</div>;
  }

  const handleReply = () => {
    const mailto = `mailto:${email.from_email}?subject=Re: ${encodeURIComponent(email.subject)}`;
    window.location.href = mailto;
  };

  const handleForward = () => {
    const mailto = `mailto:?subject=Fwd: ${encodeURIComponent(email.subject)}&body=${encodeURIComponent(
      email.body_text || ''
    )}`;
    window.location.href = mailto;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/emails')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Emails
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReply}>
            <Reply className="mr-2 h-4 w-4" />
            Reply
          </Button>
          <Button variant="outline" size="sm" onClick={handleForward}>
            <Forward className="mr-2 h-4 w-4" />
            Forward
          </Button>
        </div>
      </div>

      {/* Email Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{email.subject || '(No Subject)'}</CardTitle>
              <div className="mt-4 space-y-2">
                <div className="flex items-start">
                  <span className="text-sm font-medium w-20">From:</span>
                  <span className="text-sm">
                    {email.from_name ? `${email.from_name} <${email.from_email}>` : email.from_email}
                  </span>
                </div>
                {email.to_emails.length > 0 && (
                  <div className="flex items-start">
                    <span className="text-sm font-medium w-20">To:</span>
                    <span className="text-sm">{email.to_emails.join(', ')}</span>
                  </div>
                )}
                {email.cc_emails.length > 0 && (
                  <div className="flex items-start">
                    <span className="text-sm font-medium w-20">CC:</span>
                    <span className="text-sm">{email.cc_emails.join(', ')}</span>
                  </div>
                )}
                <div className="flex items-start">
                  <span className="text-sm font-medium w-20">Date:</span>
                  <span className="text-sm">{format(new Date(email.date), 'PPpp')}</span>
                </div>
              </div>
            </div>
            <div>
              {email.case_number ? (
                <div className="flex items-center gap-2">
                  <Badge>Linked to {email.case_number}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unlinkMutation.mutate()}
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowLinkDialog(true)}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Link to Case
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <>
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({email.attachments.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {email.attachments.map((attachment) => (
                    <Badge key={attachment.id} variant="outline">
                      {attachment.filename}
                      {attachment.size && ` (${Math.round(attachment.size / 1024)}KB)`}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator className="my-4" />
            </>
          )}

          {/* Email Body */}
          <div className="mt-4">
            {email.body_html ? (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: email.body_html }}
              />
            ) : email.body_text ? (
              <div className="whitespace-pre-wrap font-mono text-sm">{email.body_text}</div>
            ) : (
              <div className="text-muted-foreground">No content</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Link to Case Dialog */}
      <LinkToCaseDialog
        emailId={emailId}
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        onLinked={() => {
          setShowLinkDialog(false);
          queryClient.invalidateQueries({ queryKey: ['email', emailId] });
        }}
      />
    </div>
  );
}
