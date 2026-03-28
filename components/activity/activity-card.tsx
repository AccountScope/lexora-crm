import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Briefcase, FileText, Clock3, Receipt, User, MessageSquare, AtSign } from "lucide-react";
import type { ActivityRecord } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const ICONS: Record<ActivityRecord["type"], React.ComponentType<{ className?: string }>> = {
  case: Briefcase,
  document: FileText,
  time: Clock3,
  billing: Receipt,
  user: User,
  comment: MessageSquare,
  mention: AtSign,
};

interface Props {
  activity: ActivityRecord;
}

export const ActivityCard = ({ activity }: Props) => {
  const Icon = ICONS[activity.type] ?? MessageSquare;
  const timestamp = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true });
  const target = activity.linkUrl ?? (activity.case?.id ? `/cases/${activity.case.id}` : undefined);
  return (
    <div className="relative flex gap-4 pb-6">
      <div className="flex flex-col items-center">
        <div className="rounded-full border bg-muted p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-2 h-full w-px bg-border" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{activity.action}</p>
          <Badge variant="secondary" className="capitalize">
            {activity.type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{activity.description}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {activity.user?.name ? (
            <span className="inline-flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>{activity.user.name.split(" ").map((chunk) => chunk[0]).join("")}</AvatarFallback>
              </Avatar>
              <span>{activity.user.name}</span>
            </span>
          ) : null}
          <span>{timestamp}</span>
          {activity.case?.title && <span>Case · {activity.case.title}</span>}
          {activity.document?.title && <span>Doc · {activity.document.title}</span>}
        </div>
        {target && (
          <Link className="text-sm font-medium text-primary hover:underline" href={target}>
            View details ↗
          </Link>
        )}
      </div>
    </div>
  );
};
