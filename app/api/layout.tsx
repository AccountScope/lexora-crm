// Force all API routes to be dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function APILayout({ children }: { children: React.ReactNode }) {
  return children;
}
