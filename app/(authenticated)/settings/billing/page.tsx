'use client';

import { Suspense } from 'react';
import { BillingPageContent } from './billing-content';

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 animate-pulse">Loading billing...</div>}>
      <BillingPageContent />
    </Suspense>
  );
}
