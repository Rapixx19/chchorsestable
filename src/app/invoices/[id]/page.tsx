/**
 * @module app/invoices
 * @description Invoice detail page
 * @safety RED
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { InvoiceDetail } from '@/modules/invoices/ui';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  useEffect(() => {
    if (!isValidUUID(invoiceId)) {
      router.replace('/invoices');
    }
  }, [invoiceId, router]);

  if (!isValidUUID(invoiceId)) {
    return null; // Prevent render while redirecting
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Invoice Details</h1>
      <InvoiceDetail invoiceId={invoiceId} />
    </main>
  );
}
