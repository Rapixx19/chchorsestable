/**
 * @module clients/ui
 * @description List of clients
 * @safety GREEN
 */

'use client';

import { useEffect, useState } from 'react';
import { clientService } from '../services/client.service';
import type { Client } from '../domain/client.types';
import { TelegramBadge } from './TelegramBadge';

interface ClientsListProps {
  stableId: string;
  refreshKey?: number;
}

export default function ClientsList({ stableId, refreshKey }: ClientsListProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClients() {
      setIsLoading(true);
      setError(null);

      const result = await clientService.getClientsByStable(stableId);

      setIsLoading(false);

      if (!result.success) {
        setError(result.error ?? 'Failed to load clients');
        return;
      }

      setClients(result.clients ?? []);
    }

    fetchClients();
  }, [stableId, refreshKey]);

  if (isLoading) {
    return <p className="text-gray-500">Loading clients...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (clients.length === 0) {
    return <p className="text-gray-500">No clients yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {clients.map((client) => (
        <div key={client.id} className="p-3 border rounded">
          <div className="flex items-center gap-2">
            <p className="font-medium">{client.name}</p>
            <TelegramBadge isLinked={!!client.telegram_chat_id} />
          </div>
          {client.email && <p className="text-sm text-gray-600">{client.email}</p>}
          {client.phone && <p className="text-sm text-gray-600">{client.phone}</p>}
        </div>
      ))}
    </div>
  );
}
