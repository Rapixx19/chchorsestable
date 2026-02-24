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
    return <p className="text-zinc-500">Loading clients...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (clients.length === 0) {
    return (
      <div className="glass-card rounded-v-card p-12 text-center">
        <p className="text-zinc-500 mb-4">No clients yet.</p>
        <p className="text-zinc-600 text-sm">
          Add your first client to start managing their horses and services.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {clients.map((client) => (
        <div key={client.id} className="glass-card rounded-v-card p-4 hover:border-white/20 transition-all">
          <div className="flex items-center gap-2">
            <p className="font-medium text-white">{client.name}</p>
            <TelegramBadge isLinked={!!client.telegram_chat_id} />
          </div>
          {client.email && <p className="text-sm text-zinc-400">{client.email}</p>}
          {client.phone && <p className="text-sm text-zinc-400">{client.phone}</p>}
        </div>
      ))}
    </div>
  );
}
