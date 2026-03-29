// Force all authenticated routes to be dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
