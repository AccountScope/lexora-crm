/**
 * Create New Trust Transaction Page
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import LedgerForm from '@/components/trust/ledger-form';

export default function NewTransactionPage() {
  const searchParams = useSearchParams();
  const preselectedLedger = searchParams.get('ledger');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/trust-accounting/transactions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Trust Transaction</h1>
          <p className="text-gray-600 mt-1">
            Add deposit, withdrawal, transfer, or fee transaction
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <LedgerForm preselectedLedgerId={preselectedLedger || undefined} />
      </div>
    </div>
  );
}
