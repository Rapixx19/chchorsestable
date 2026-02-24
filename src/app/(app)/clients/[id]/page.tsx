/**
 * @module app/clients
 * @description Client detail page
 * @safety GREEN
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ClientDetail } from '@/modules/clients/ui';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  useEffect(() => {
    if (!isValidUUID(clientId)) {
      router.replace('/clients');
    }
  }, [clientId, router]);

  if (!isValidUUID(clientId)) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <ClientDetail clientId={clientId} />
      </div>
    </main>
  );
}
