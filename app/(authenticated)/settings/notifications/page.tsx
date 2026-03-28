"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/lib/hooks/use-notifications";

const notificationTypes = [
  { key: "DEADLINE_REMINDER", label: "Deadline reminders", description: "1, 3, and 7-day warning emails" },
  { key: "CASE_UPDATE", label: "Case updates", description: "Changes to matter status or milestones" },
  { key: "DOCUMENT_UPLOADED", label: "Document uploads", description: "New evidence or filings added" },
  { key: "INVOICE_SENT", label: "Invoice sent", description: "Billing notices and payment reminders" },
  { key: "NEW_CASE_ASSIGNMENT", label: "Case assignment", description: "When you're assigned to a new matter" },
  { key: "CLIENT_PORTAL_MESSAGE", label: "Client portal messages", description: "Client replies through the portal" },
] as const;

export default function NotificationSettingsPage() {
  const { data, isLoading } = useNotificationPreferences();
  const mutation = useUpdateNotificationPreferences();
  const form = useForm({
    defaultValues: {
      emailFrequency: "INSTANT",
      channels: ["EMAIL", "IN_APP"],
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      digestHour: 7,
      toggles: notificationTypes.reduce<Record<string, boolean>>((acc, item) => ({ ...acc, [item.key]: true }), {}),
    },
  });

  const preferences = data?.data;

  useEffect(() => {
    form.register("emailFrequency");
    form.register("channels");
    notificationTypes.forEach((item) => form.register(`toggles.${item.key}`));
  }, [form]);

  useEffect(() => {
    if (preferences) {
      form.reset({
        emailFrequency: preferences.emailFrequency,
        channels: preferences.channels,
        quietHoursStart: preferences.quietHours?.start ?? "",
        quietHoursEnd: preferences.quietHours?.end ?? "",
        digestHour: preferences.digestHour,
        toggles: preferences.toggles,
      });
    }
  }, [preferences, form]);

  const submit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  const toggleChannel = (channel: string, checked: boolean) => {
    const current = form.getValues("channels") ?? [];
    if (checked) {
      form.setValue("channels", Array.from(new Set([...current, channel])));
    } else {
      form.setValue(
        "channels",
        current.filter((item) => item !== channel)
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Notification preferences</h1>
        <p className="text-sm text-muted-foreground">Control which alerts hit your inbox and when.</p>
      </div>
      <form className="grid gap-6 lg:grid-cols-[2fr,1fr]" onSubmit={submit}>
        <Card className="col-span-1 space-y-2">
          <CardHeader>
            <CardTitle>Channels & cadence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email frequency</label>
              <Select onValueChange={(value) => form.setValue("emailFrequency", value)} value={form.watch("emailFrequency") ?? "INSTANT"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSTANT">Instant</SelectItem>
                  <SelectItem value="DAILY">Daily digest</SelectItem>
                  <SelectItem value="WEEKLY">Weekly summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Quiet hours</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Start</p>
                  <Input type="time" {...form.register("quietHoursStart")} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">End</p>
                  <Input type="time" {...form.register("quietHoursEnd")} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Emails paused overnight to protect focus.</p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Digest hour</label>
              <Input type="number" min={0} max={23} {...form.register("digestHour", { valueAsNumber: true })} />
              <p className="text-xs text-muted-foreground">When daily/weekly summaries should be delivered.</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Channels</p>
              {[
                { label: "Email", value: "EMAIL" },
                { label: "In-app", value: "IN_APP" },
                { label: "Push", value: "PUSH" },
              ].map((channel) => (
                <div key={channel.value} className="flex items-center justify-between">
                  <span className="text-sm">{channel.label}</span>
                  <Switch
                    checked={form.watch("channels")?.includes(channel.value) ?? false}
                    onCheckedChange={(checked) => toggleChannel(channel.value, checked)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>Notification types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {notificationTypes.map((notification) => (
              <div key={notification.key} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{notification.label}</p>
                  <p className="text-xs text-muted-foreground">{notification.description}</p>
                </div>
                <Switch
                  checked={form.watch(`toggles.${notification.key}`) ?? true}
                  onCheckedChange={(checked) => form.setValue(`toggles.${notification.key}`, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <Button className="w-full" disabled={mutation.isPending || isLoading} type="submit">
            {mutation.isPending ? "Saving preferences…" : "Save preferences"}
          </Button>
        </div>
      </form>
    </div>
  );
}
