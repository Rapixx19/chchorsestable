/**
 * @module horses/ui
 * @description Form to create a new horse
 * @safety GREEN
 */

'use client';

import { useState, useEffect } from 'react';
import { horseService } from '../services/horse.service';
import { clientService } from '@/modules/clients/services/client.service';
import type { Client } from '@/modules/clients/domain/client.types';

interface CreateHorseFormProps {
  stableId: string;
  onSuccess?: () => void;
}

export default function CreateHorseForm({ stableId, onSuccess }: CreateHorseFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchClients() {
      const result = await clientService.getClientsByStable(stableId);
      if (result.success && result.clients) {
        setClients(result.clients);
      }
    }
    fetchClients();
  }, [stableId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await horseService.createHorse({
      stable_id: stableId,
      client_id: clientId,
      name,
      breed: breed || null,
      birth_year: birthYear ? parseInt(birthYear, 10) : null,
      notes: notes || null,
    });

    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Failed to create horse');
      return;
    }

    setClientId('');
    setName('');
    setBreed('');
    setBirthYear('');
    setNotes('');
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 border rounded">
      <h2 className="text-lg font-semibold">Add Horse</h2>

      <select
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        disabled={isLoading}
        className="border rounded px-3 py-2"
        required
      >
        <option value="">Select Client *</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Horse Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isLoading}
        className="border rounded px-3 py-2"
        required
        minLength={2}
      />

      <input
        type="text"
        placeholder="Breed"
        value={breed}
        onChange={(e) => setBreed(e.target.value)}
        disabled={isLoading}
        className="border rounded px-3 py-2"
      />

      <input
        type="number"
        placeholder="Birth Year"
        value={birthYear}
        onChange={(e) => setBirthYear(e.target.value)}
        disabled={isLoading}
        className="border rounded px-3 py-2"
        min={1980}
        max={new Date().getFullYear()}
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
        {isLoading ? 'Creating...' : 'Add Horse'}
      </button>
    </form>
  );
}
