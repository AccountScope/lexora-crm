"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface Message {
  id: string;
  senderType: "client" | "solicitor";
  senderName?: string;
  message: string;
  createdAt: string;
  read: boolean;
  attachments?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
}

interface MatterMessagesProps {
  matterId: string;
  currentUserType: "client" | "solicitor";
  currentUserName: string;
}

export function MatterMessages({
  matterId,
  currentUserType,
  currentUserName,
}: MatterMessagesProps) {
  const [messageText, setMessageText] = useState("");
  const queryClient = useQueryClient();

  // Fetch messages
  const { data, isLoading } = useQuery({
    queryKey: ["matter-messages", matterId],
    queryFn: async () => {
      const res = await fetch(`/api/matters/${matterId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    refetchInterval: 10000, // Auto-refresh every 10s
  });

  const messages: Message[] = data?.messages || [];

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(`/api/matters/${matterId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          senderType: currentUserType,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send message");
      }

      return res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["matter-messages", matterId] });
    },
  });

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMutation.mutate(messageText.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle>Secure Messaging</CardTitle>
        <CardDescription>Communicate with your solicitor directly</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2 text-center">
              <Send className="w-12 h-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Send a message to start the conversation
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.senderType === currentUserType;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback
                      className={cn(
                        isOwnMessage
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {msg.senderType === "client" ? "C" : "S"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message bubble */}
                  <div
                    className={cn(
                      "flex-1 max-w-[70%] space-y-1",
                      isOwnMessage ? "items-end" : "items-start"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {isOwnMessage
                          ? "You"
                          : msg.senderName ||
                            (msg.senderType === "client" ? "Client" : "Solicitor")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.createdAt), "HH:mm")}
                      </span>
                      {!msg.read && !isOwnMessage && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>

                    <div
                      className={cn(
                        "rounded-lg px-4 py-2.5",
                        isOwnMessage
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    </div>

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="space-y-1">
                        {msg.attachments.map((attachment, idx) => (
                          <a
                            key={idx}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "flex items-center gap-2 text-xs px-3 py-1.5 rounded border",
                              isOwnMessage
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-gray-200 bg-white text-gray-700"
                            )}
                          >
                            <Paperclip className="w-3 h-3" />
                            <span className="truncate">{attachment.name}</span>
                            <span className="text-muted-foreground">
                              ({(attachment.size / 1024).toFixed(0)}KB)
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input area */}
        <div className="border-t pt-4 space-y-2">
          <Textarea
            placeholder="Type your message... (Shift+Enter for new line)"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={3}
            disabled={sendMutation.isPending}
          />
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="text-muted-foreground"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Attach (Coming soon)
            </Button>
            <Button
              onClick={handleSend}
              disabled={!messageText.trim() || sendMutation.isPending}
              size="sm"
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
