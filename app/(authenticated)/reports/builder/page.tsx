'use client';

import { Suspense } from 'react';
import { ReportBuilderPageContent } from './builder-content';

export default function ReportBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 animate-pulse">Loading report builder...</div>}>
      <ReportBuilderPageContent />
    </Suspense>
  );
}
