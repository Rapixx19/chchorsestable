/**
 * @module stable/ui
 * @description Form to create a new stable
 * @safety GREEN
 */

'use client';

import { useState } from 'react';
import { stableService } from '../services/stable.service';

interface CreateStableFormProps {
  ownerId: string;
}

export default function CreateStableForm({ ownerId }: CreateStableFormProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await stableService.createStable(name, ownerId);

    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Failed to create stable');
      return;
    }

    window.location.href = '/dashboard';
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm p-6">
      <h1 className="text-2xl font-bold text-center">Create Your Stable</h1>
      <p className="text-gray-600 text-center text-sm">
        A stable is your business workspace.
      </p>

      <input
        type="text"
        placeholder="Stable name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isLoading}
        className="border rounded px-3 py-2"
        required
        minLength={2}
        maxLength={100}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
