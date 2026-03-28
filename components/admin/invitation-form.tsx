"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminRoles, useInvitationActions } from "@/lib/hooks/use-admin";
import type { InvitationCreateInput } from "@/lib/hooks/use-admin";

export const InvitationForm = () => {
  const rolesQuery = useAdminRoles();
  const invitationActions = useInvitationActions();
  const roles = (rolesQuery.data as any)?.data ?? rolesQuery.data ?? [];
  const [form, setForm] = useState({ email: "", roleId: "", message: "" });
  const [bulkInvites, setBulkInvites] = useState<InvitationCreateInput[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const submitSingle = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    await invitationActions.create.mutateAsync({ invites: [form] });
    setForm({ email: "", roleId: "", message: "" });
    setFeedback("Invitation sent");
  };

  const parseCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const [headerRow, ...rows] = lines;
    if (!headerRow) return;
    const headers = headerRow.split(/,|;|\t/).map((p) => p.trim().toLowerCase());
    const emailIdx = headers.findIndex((h) => h === "email");
    const roleIdx = headers.findIndex((h) => h === "role" || h === "roleid");
    const messageIdx = headers.findIndex((h) => h === "message" || h === "custom_message");
    if (emailIdx === -1 || roleIdx === -1) {
      setFeedback("CSV must include 'email' and 'role' columns");
      return;
    }
    const parsed: InvitationCreateInput[] = rows
      .map((row) => row.split(/,|;|\t/))
      .filter((cols) => cols[emailIdx])
      .map((cols) => ({
        email: cols[emailIdx].trim(),
        roleId: cols[roleIdx].trim(),
        customMessage: messageIdx >= 0 ? cols[messageIdx]?.trim() : undefined,
      }));
    setBulkInvites(parsed);
    setFeedback(`${parsed.length} invitation${parsed.length === 1 ? "" : "s"} ready to send`);
  };

  const sendBulk = async () => {
    if (!bulkInvites.length) return;
    await invitationActions.create.mutateAsync({ invites: bulkInvites });
    setBulkInvites([]);
    setFeedback("Bulk invitations sent");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Send a single invitation</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submitSingle}>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Role</label>
              <Select value={form.roleId} onValueChange={(value) => setForm((prev) => ({ ...prev, roleId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role: RoleSummary) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Custom message (optional)</label>
              <Textarea rows={3} value={form.message} onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))} />
            </div>
            {feedback && <p className="text-sm text-emerald-600">{feedback}</p>}
            <Button type="submit" disabled={invitationActions.create.isPending}>
              {invitationActions.create.isPending ? "Sending…" : "Send invitation"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Bulk upload (CSV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">CSV must include columns: <strong>email</strong>, <strong>role</strong>, optional <strong>message</strong>.</p>
          <Input type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && parseCsv(event.target.files[0])} />
          {bulkInvites.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Preview ({bulkInvites.length} invites)</p>
              <ul className="mt-2 max-h-40 overflow-y-auto space-y-1 text-muted-foreground">
                {bulkInvites.slice(0, 6).map((invite) => (
                  <li key={`${invite.email}-${invite.roleId}`}>
                    {invite.email} → {invite.roleId}
                  </li>
                ))}
                {bulkInvites.length > 6 && <li>…and more</li>}
              </ul>
            </div>
          )}
          <Button type="button" variant="secondary" disabled={!bulkInvites.length || invitationActions.create.isPending} onClick={sendBulk}>
            {invitationActions.create.isPending ? "Sending…" : "Send bulk invitations"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

type RoleSummary = {
  id: string;
  name: string;
};
