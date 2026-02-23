/**
 * @module clients/ui
 * @description Form to create a new client
 * @safety GREEN
 */

'use client';

import { useState } from 'react';
import { clientService } from '../services/client.service';

interface CreateClientFormProps {
  stableId: string;
  onSuccess?: () => void;
}

export default function CreateClientForm({ stableId, onSuccess }: CreateClientFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await clientService.createClient({
      stable_id: stableId,
      name,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
    });

    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Failed to create client');
      return;
    }

    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 border rounded">
      <h2 className="text-lg font-semibold">Add Client</h2>

      <input
        type="text"
        placeholder="Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isLoading}
        className="border rounded px-3 py-2"
        required
        minLength={2}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        className="border rounded px-3 py-2"
      />

      <input
        type="tel"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={isLoading}
        className="border rounded px-3 py-2"
      />

      <textarea
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={isLoading}
        className="border rounded px-3 py-2"
        rows={2}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Add Client'}
      </button>
    </form>
  );
}
