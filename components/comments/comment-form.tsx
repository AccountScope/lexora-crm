"use client";

import { useRef, useState } from "react";
import { Paperclip, SendHorizonal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MentionAutocomplete } from "@/components/comments/mention-autocomplete";
import { useCreateComment } from "@/lib/hooks/use-comments";
import { useDocumentUpload } from "@/lib/hooks/use-documents";
import { createMentionToken } from "@/lib/comments/utils";
import type { CommentAttachment } from "@/types";

interface CommentFormProps {
  entityType: string;
  entityId: string;
  parentId?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
  onCancelReply?: () => void;
}

export const CommentForm = ({ entityType, entityId, parentId, autoFocus, onSubmitted, onCancelReply }: CommentFormProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionRange, setMentionRange] = useState<{ start: number; end: number } | null>(null);
  const [attachments, setAttachments] = useState<CommentAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const createComment = useCreateComment({ entityType, entityId });
  const uploader = useDocumentUpload({ matterId: entityType === "case" ? entityId : undefined });

  const detectMention = (text: string, caret: number) => {
    const uptoCaret = text.slice(0, caret);
    const match = uptoCaret.match(/@([A-Za-z0-9._-]{0,30})$/);
    if (match) {
      const start = caret - match[1].length - 1;
      if (start === 0 || /\s/.test(uptoCaret[start - 1] ?? "")) {
        setMentionQuery(match[1]);
        setMentionRange({ start, end: caret });
        return;
      }
    }
    setMentionQuery("");
    setMentionRange(null);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    setValue(nextValue);
    const caret = event.target.selectionStart ?? nextValue.length;
    detectMention(nextValue, caret);
  };

  const insertMention = (user: { id: string; name: string }) => {
    if (!mentionRange) return;
    const current = value;
    const before = current.slice(0, mentionRange.start);
    const after = current.slice(mentionRange.end);
    const token = createMentionToken(user.name, user.id);
    const nextValue = `${before}${token} ${after}`;
    setValue(nextValue);
    setMentionQuery("");
    setMentionRange(null);
    requestAnimationFrame(() => {
      const nextCaret = mentionRange.start + token.length + 1;
      textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
      textareaRef.current?.focus();
    });
  };

  const handleAttachment = async (files: FileList | null) => {
    if (!files?.length) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "metadata",
          JSON.stringify({
            matterId: entityType === "case" ? entityId : undefined,
            classification: "FIRM_CONFIDENTIAL",
            documentType: "COMMENT_ATTACHMENT",
          })
        );
        const response = await uploader.mutateAsync(formData);
        const doc = response?.data;
        if (doc) {
          setAttachments((prev) => [
            ...prev,
            {
              documentId: doc.id,
              title: doc.title,
              mimeType: doc.latestVersion?.mimeType,
              sizeBytes: doc.latestVersion?.fileSizeBytes,
            },
          ]);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!value.trim()) return;
    await createComment.mutateAsync({
      content: value,
      parentId,
      attachments,
    });
    setValue("");
    setAttachments([]);
    setMentionQuery("");
    setMentionRange(null);
    onSubmitted?.();
  };

  const disabled = !value.trim() || value.length > 5000 || createComment.isPending;

  return (
    <div className="space-y-2 rounded-lg border bg-card p-4">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          autoFocus={autoFocus}
          placeholder="Write your comment... use @ to mention a teammate"
          rows={parentId ? 3 : 4}
          onChange={handleChange}
          onClick={(event) => {
            const caret = (event.target as HTMLTextAreaElement).selectionStart ?? value.length;
            detectMention(value, caret);
          }}
          onKeyUp={(event) => {
            const caret = (event.target as HTMLTextAreaElement).selectionStart ?? value.length;
            detectMention(value, caret);
          }}
        />
        {mentionQuery && (
          <div className="absolute left-0 top-full z-20 mt-2">
            <MentionAutocomplete
              query={mentionQuery}
              onSelect={(user) => insertMention({ id: user.id, name: user.name })}
            />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <Badge key={attachment.documentId} variant="secondary" className="flex items-center gap-2">
            {attachment.title}
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setAttachments((prev) => prev.filter((item) => item.documentId !== attachment.documentId))}
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <label className="inline-flex cursor-pointer items-center gap-1 text-primary">
            <input
              type="file"
              className="hidden"
              multiple
              onChange={(event) => {
                handleAttachment(event.target.files);
                event.target.value = "";
              }}
            />
            <Paperclip className="h-4 w-4" /> Attach files
          </label>
          <span>
            {value.length}/5000
          </span>
          {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        <div className="flex items-center gap-2">
          {parentId && (
            <Button variant="ghost" size="sm" onClick={onCancelReply}>
              Cancel
            </Button>
          )}
          <Button size="sm" onClick={handleSubmit} disabled={disabled}>
            {createComment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizonal className="mr-2 h-4 w-4" />}
            Post
          </Button>
        </div>
      </div>
    </div>
  );
};
