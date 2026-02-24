/**
 * @module horses/ui
 * @description List of horses
 * @safety GREEN
 */

'use client';

import { useEffect, useState } from 'react';
import { horseService } from '../services/horse.service';
import type { Horse } from '../domain/horse.types';

interface HorsesListProps {
  stableId: string;
  refreshKey?: number;
}

export default function HorsesList({ stableId, refreshKey }: HorsesListProps) {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHorses() {
      setIsLoading(true);
      setError(null);

      const result = await horseService.getHorsesByStable(stableId);

      setIsLoading(false);

      if (!result.success) {
        setError(result.error ?? 'Failed to load horses');
        return;
      }

      setHorses(result.horses ?? []);
    }

    fetchHorses();
  }, [stableId, refreshKey]);

  if (isLoading) {
    return <p className="text-zinc-500">Loading horses...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (horses.length === 0) {
    return (
      <div className="glass-card rounded-v-card p-12 text-center">
        <p className="text-zinc-500 mb-4">No horses yet.</p>
        <p className="text-zinc-600 text-sm">
          Add your first horse to get started with assignments.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {horses.map((horse) => (
        <div key={horse.id} className="glass-card rounded-v-card p-4 hover:border-white/20 transition-all">
          <p className="font-medium text-white">{horse.name}</p>
          {horse.breed && <p className="text-sm text-zinc-400">{horse.breed}</p>}
          {horse.birth_year && <p className="text-sm text-zinc-400">Born: {horse.birth_year}</p>}
        </div>
      ))}
    </div>
  );
}
