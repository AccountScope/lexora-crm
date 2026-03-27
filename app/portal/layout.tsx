import "@/app/globals.css";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50 p-6">{children}</div>;
}
