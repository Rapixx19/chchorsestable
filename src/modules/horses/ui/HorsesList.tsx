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
    return <p className="text-gray-500">Loading horses...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (horses.length === 0) {
    return <p className="text-gray-500">No horses yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {horses.map((horse) => (
        <div key={horse.id} className="p-3 border rounded">
          <p className="font-medium">{horse.name}</p>
          {horse.breed && <p className="text-sm text-gray-600">{horse.breed}</p>}
          {horse.birth_year && <p className="text-sm text-gray-600">Born: {horse.birth_year}</p>}
        </div>
      ))}
    </div>
  );
}
