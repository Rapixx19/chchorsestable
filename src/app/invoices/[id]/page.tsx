/**
 * @module app/invoices
 * @description Invoice detail page
 * @safety RED
 */

'use client';

import { useParams } from 'next/navigation';
import { InvoiceDetail } from '@/modules/invoices/ui';

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Invoice Details</h1>
      <InvoiceDetail invoiceId={invoiceId} />
    </main>
  );
}
