'use client';

import { Suspense } from 'react';
import { NewTransactionPageContent } from './new-content';

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<div className="p-8 animate-pulse">Loading transaction form...</div>}>
      <NewTransactionPageContent />
    </Suspense>
  );
}
