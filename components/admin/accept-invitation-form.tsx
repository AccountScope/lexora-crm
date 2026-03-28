"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import zxcvbn from "zxcvbn";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { InvitationRecord } from "@/types";
import { acceptInvitationAction } from "@/app/accept-invitation/actions";

interface Props {
  invitation: InvitationRecord;
  token: string;
}

const hints = ["Weak", "Fair", "Good", "Strong", "Excellent"];
const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500", "bg-green-600"];

export const AcceptInvitationForm = ({ invitation, token }: Props) => {
  const [state, formAction] = useFormState(acceptInvitationAction, { error: null });
  const [password, setPassword] = useState("");
  const score = password ? (zxcvbn as any)(password).score : 0;
  return (
    <form className="space-y-4" action={formAction}>
      <input type="hidden" name="token" value={token} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">First name</label>
          <Input name="firstName" defaultValue={invitation.email.split("@")[0]} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Last name</label>
          <Input name="lastName" placeholder="Surname" required />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Phone (optional)</label>
        <Input name="phone" placeholder="+1 415 555 0100" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Create a password</label>
        <Input name="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        <div className="h-2 w-full rounded-full bg-muted">
          <div className={`h-full rounded-full ${password ? strengthColors[score] : "bg-muted"}`} style={{ width: password ? `${((score + 1) / 5) * 100}%` : "0%" }} />
        </div>
        <p className="text-xs text-muted-foreground">{password ? hints[score] : "Use at least 12 characters plus numbers & symbols."}</p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox name="terms" required />
        <span>I confirm this address belongs to me and agree to Lexora's security terms.</span>
      </label>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full">
        Activate account
      </Button>
    </form>
  );
};
