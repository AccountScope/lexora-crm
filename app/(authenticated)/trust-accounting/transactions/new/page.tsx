/**
 * Create New Trust Transaction Page
 */

'use client';

export const dynamic = 'force-dynamic';

import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import LedgerForm from '@/components/trust/ledger-form';
import { PageHeader } from '@/components/ui/page-header';

export default function NewTransactionPage() {
  const searchParams = useSearchParams();
  const preselectedLedger = searchParams.get('ledger');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/trust-accounting/transactions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <PageHeader
          title="New Trust Transaction"
          description="Add deposit, withdrawal, transfer, or fee transaction"
          className="mb-0"
        />
      </div>

      <div className="max-w-3xl">
        <LedgerForm preselectedLedgerId={preselectedLedger || undefined} />
      </div>
    </div>
  );
}
