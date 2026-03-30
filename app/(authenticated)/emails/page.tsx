'use client';

import { Suspense } from 'react';
import { EmailsPageContentPremium } from './emails-content-premium';

export default function EmailsPage() {
  return (
    <Suspense fallback={<div className="p-8 animate-pulse">Loading emails...</div>}>
      <EmailsPageContentPremium />
    </Suspense>
  );
}
