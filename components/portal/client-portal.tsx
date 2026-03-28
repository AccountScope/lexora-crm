"use client";

import { useEffect, useState } from "react";
import { usePortalCases, usePortalMessages, useSendPortalMessage } from "@/lib/hooks/use-portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export const ClientPortal = () => {
  const { data } = usePortalCases();
  const cases = data?.data ?? [];
  const [activeCase, setActiveCase] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!activeCase && cases[0]?.id) {
      setActiveCase(cases[0].id);
    }
  }, [activeCase, cases]);

  if (!cases.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No linked matters</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When your firm shares cases with you, they will appear here along with messaging, updates, and documents.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selected = cases.find((item) => item.id === activeCase) ?? cases[0];
  const messages = usePortalMessages({
    matterId: selected?.id,
    clientId: selected?.clientId ?? selected?.permittedDocuments[0]?.clientId,
  });
  const [message, setMessage] = useState("");
  const sender = useSendPortalMessage({
    matterId: selected?.id ?? "",
    clientId: selected?.clientId ?? selected?.permittedDocuments[0]?.clientId ?? "",
  });

  const handleSend = async () => {
    if (!message.trim() || !selected || !selected.clientId) return;
    await sender.mutateAsync({ message, direction: "inbound" });
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client cases</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selected?.id} onValueChange={setActiveCase} className="space-y-6">
            <TabsList>
              {cases.map((matter) => (
                <TabsTrigger value={matter.id} key={matter.id}>
                  {matter.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {cases.map((matter) => (
              <TabsContent key={matter.id} value={matter.id} className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">{matter.title}</p>
                      <p className="text-sm text-muted-foreground">Matter {matter.matterNumber}</p>
                    </div>
                    <Badge variant="secondary">{matter.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Last updated {formatDistanceToNow(new Date(matter.lastUpdated), { addSuffix: true })}
                  </p>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Secure messaging</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {(messages.data?.data ?? []).map((msg) => (
                        <div key={msg.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{msg.authorName ?? "System"}</span>
                            <span>{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                          </div>
                          <p className="text-sm">{msg.body}</p>
                          <Badge variant={msg.direction === "inbound" ? "secondary" : "success"} className="mt-2">
                            {msg.direction === "inbound" ? "Client" : "Firm"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Send a secure message" />
                    <Button onClick={handleSend} disabled={sender.isPending || !message.trim()}>
                      Send
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
