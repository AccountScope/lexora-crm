/**
 * Create New Trust Account Page
 */

'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import TrustAccountForm from '@/components/trust/trust-account-form';
import { PageHeader } from '@/components/ui/page-header';

export default function NewTrustAccountPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/trust-accounting/accounts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <PageHeader
          title="Create Trust Account"
          description="Set up a new IOLTA-compliant trust account"
          className="mb-0"
        />
      </div>

      <div className="max-w-3xl">
        <TrustAccountForm />
      </div>
    </div>
  );
}
