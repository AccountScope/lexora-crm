import { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

const buildRequest = () => {
  const headerList = headers();
  const requestHeaders = new Headers();
  headerList.forEach((value, key) => requestHeaders.set(key, value));
  return new Request("https://lexora.local/admin", { headers: requestHeaders });
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await getAuthContext(buildRequest());
  if (!auth.user) {
    redirect("/login");
  }
  if (auth.user.role !== "admin") {
    redirect("/dashboard");
  }
  return <AppShell>{children}</AppShell>;
}
