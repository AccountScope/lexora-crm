/**
 * Create New Trust Account Page
 */

'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import TrustAccountForm from '@/components/trust/trust-account-form';

export default function NewTrustAccountPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/trust-accounting/accounts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Trust Account</h1>
          <p className="text-gray-600 mt-1">Set up a new IOLTA-compliant trust account</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <TrustAccountForm />
      </div>
    </div>
  );
}
