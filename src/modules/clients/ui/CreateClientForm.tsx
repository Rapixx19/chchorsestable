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

  const inputClassName = "w-full px-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-v-card text-white placeholder-zinc-500 focus:outline-none focus:border-stable-gold/50 focus:ring-1 focus:ring-stable-gold/20 transition-all disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-v-card p-8 space-y-4">
      <h2 className="text-lg font-semibold text-white">Add Client</h2>

      <input
        type="text"
        placeholder="Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isLoading}
        className={inputClassName}
        required
        minLength={2}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        className={inputClassName}
      />

      <input
        type="tel"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={isLoading}
        className={inputClassName}
      />

      <textarea
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={isLoading}
        className={inputClassName}
        rows={2}
      />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-stable-gold text-zinc-950 font-bold rounded-v-card hover:scale-[1.02] transition-all disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Add Client'}
      </button>
    </form>
  );
}
