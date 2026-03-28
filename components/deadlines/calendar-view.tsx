"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, type Event as CalendarEvent, type View } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { rrulestr } from "rrule";
import enUS from "date-fns/locale/en-US";
import type { DeadlineRecord } from "@/types";
import { cn } from "@/lib/utils/cn";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface Props {
  deadlines: DeadlineRecord[];
  onRangeChange?: (range: { start: Date; end: Date }) => void;
  onSelectDeadline?: (deadline: DeadlineRecord) => void;
}

interface DeadlineEvent extends CalendarEvent {
  resource: DeadlineRecord;
}

const colors: Record<string, string> = {
  HIGH: "bg-destructive/90 border-destructive text-destructive-foreground",
  MEDIUM: "bg-amber-200 border-amber-300 text-amber-900",
  LOW: "bg-emerald-200 border-emerald-300 text-emerald-900",
};

const expandDeadlines = (deadlines: DeadlineRecord[], range?: { start: Date; end: Date }): DeadlineEvent[] => {
  if (!deadlines.length) return [];
  const start = range?.start ?? new Date();
  const end = range?.end ?? new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  const events: DeadlineEvent[] = [];

  deadlines.forEach((deadline) => {
    const startDate = deadline.startDate ? new Date(deadline.startDate) : new Date(deadline.dueDate);
    const dueDate = new Date(deadline.dueDate);
    if (deadline.recurrenceRule) {
      try {
        const rule = rrulestr(deadline.recurrenceRule.startsWith("RRULE") ? deadline.recurrenceRule : `RRULE:${deadline.recurrenceRule}`, {
          dtstart: startDate,
        });
        const instances = rule.between(start, end, true);
        instances.forEach((occurrence) => {
          const ocStart = new Date(occurrence);
          const ocEnd = new Date(occurrence.getTime() + 60 * 60 * 1000);
          events.push({
            title: deadline.title,
            start: ocStart,
            end: ocEnd,
            allDay: false,
            resource: deadline,
          });
        });
      } catch (error) {
        events.push({
          title: deadline.title,
          start: dueDate,
          end: new Date(dueDate.getTime() + 60 * 60 * 1000),
          allDay: false,
          resource: deadline,
        });
      }
    } else {
      events.push({
        title: deadline.title,
        start: startDate,
        end: new Date(dueDate.getTime() + 60 * 60 * 1000),
        allDay: false,
        resource: deadline,
      });
    }
  });

  return events;
};

export const DeadlineCalendarView = ({ deadlines, onRangeChange, onSelectDeadline }: Props) => {
  const [view, setView] = useState<View>("month");
  const [range, setRange] = useState<{ start: Date; end: Date }>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  });

  useEffect(() => {
    onRangeChange?.(range);
  }, [range, onRangeChange]);

  const events = useMemo(() => expandDeadlines(deadlines, range), [deadlines, range]);

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <Calendar
        localizer={localizer}
        events={events}
        view={view}
        onView={(next) => setView(next)}
        onRangeChange={(next) => {
          if (Array.isArray(next)) {
            const start = next[0];
            const end = next[next.length - 1];
            setRange({ start, end });
          } else if (next?.start && next?.end) {
            setRange({ start: next.start, end: next.end });
          }
        }}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectEvent={(event) => onSelectDeadline?.(event.resource as DeadlineRecord)}
        eventPropGetter={(event) => {
          const priority = (event.resource as DeadlineRecord).priority ?? "MEDIUM";
          return {
            className: cn(
              "border px-2 py-1 text-xs font-medium",
              colors[priority] ?? "bg-primary/80 border-primary/90 text-primary-foreground"
            ),
          };
        }}
      />
    </div>
  );
};
