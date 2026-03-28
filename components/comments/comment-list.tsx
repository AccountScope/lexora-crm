"use client";

import { CommentItem } from "./comment-item";

interface Comment {
  id: string;
  content: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: string | null;
}

interface CommentListProps {
  comments: Comment[];
  onReply?: (commentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
}

export function CommentList({ comments, onReply, onEdit, onDelete }: CommentListProps) {
  const topLevelComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-4">
      {topLevelComments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No comments yet</p>
      ) : (
        topLevelComments.map((comment) => (
          <div key={comment.id}>
            <CommentItem
              comment={comment}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
            {getReplies(comment.id).length > 0 && (
              <div className="ml-8 mt-4 space-y-4 border-l-2 pl-4">
                {getReplies(comment.id).map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isReply
                  />
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
