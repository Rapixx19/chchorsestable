/**
 * @module clients/ui
 * @description Client list component
 * @safety YELLOW
 */

'use client';

import type { Client } from '../domain/client.types';

interface ClientListProps {
  clients: Client[];
  onSelect?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

export function ClientList({ clients, onSelect, onDelete }: ClientListProps) {
  if (clients.length === 0) {
    return <p>No clients found.</p>;
  }

  return (
    <ul>
      {clients.map((client) => (
        <li key={client.id}>
          <div>
            <strong>{client.name}</strong>
            <span>{client.email}</span>
          </div>
          <div>
            {onSelect && (
              <button onClick={() => onSelect(client)}>View</button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(client)}>Delete</button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
