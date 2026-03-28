"use server";

import { acceptInvitation } from "@/lib/admin/invitations";
import { ApiError } from "@/lib/api/errors";
import { redirect } from "next/navigation";

export interface AcceptInvitationState {
  error?: string | null;
}

export const acceptInvitationAction = async (_prevState: AcceptInvitationState, formData: FormData): Promise<AcceptInvitationState | void> => {
  const token = formData.get("token")?.toString();
  const password = formData.get("password")?.toString();
  const firstName = formData.get("firstName")?.toString();
  const lastName = formData.get("lastName")?.toString();
  const phone = formData.get("phone")?.toString();
  const terms = formData.get("terms") === "on";
  if (!token || !password) {
    return { error: "Please complete all required fields" };
  }
  try {
    await acceptInvitation({ token, password, firstName, lastName, phone, acceptTerms: terms });
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return { error: "Unable to accept invitation" };
  }
  redirect("/login?invited=1");
};
