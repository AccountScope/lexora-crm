'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Paperclip, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

type CaseEmail = {
  id: string;
  from_email: string;
  from_name: string | null;
  subject: string;
  date: Date;
  has_attachments: boolean;
  auto_linked: boolean;
};

type CaseEmailsProps = {
  caseId: string;
};

export function CaseEmails({ caseId }: CaseEmailsProps) {
  const router = useRouter();

  const { data: emails, isLoading } = useQuery<CaseEmail[]>({
    queryKey: ['case-emails', caseId],
    queryFn: async () => {
      const res = await fetch(`/api/email?caseId=${caseId}`);
      if (!res.ok) throw new Error('Failed to fetch emails');
      const json = await res.json();
      return json.data.emails || [];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Linked Emails</CardTitle>
          <CardDescription>Loading emails...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Linked Emails</CardTitle>
            <CardDescription>
              {emails?.length || 0} email{emails?.length !== 1 ? 's' : ''} linked to this case
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/emails')}>
            View All Emails
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {emails && emails.length > 0 ? (
          <div className="space-y-4">
            {emails.map((email) => (
              <div
                key={email.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/emails/${email.id}`)}
              >
                <div className="flex items-start gap-3 flex-1">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{email.subject || '(No Subject)'}</h4>
                      {email.has_attachments && (
                        <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                      {email.auto_linked && (
                        <Badge variant="outline" className="text-xs">
                          Auto-linked
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">
                        {email.from_name || email.from_email}
                      </span>
                      {' • '}
                      {format(new Date(email.date), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/emails/${email.id}`);
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No emails linked to this case yet</p>
            <Button
              variant="link"
              size="sm"
              className="mt-2"
              onClick={() => router.push('/emails?linked=false')}
            >
              View unlinked emails
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
