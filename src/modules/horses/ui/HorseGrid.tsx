/**
 * @module horses/ui
 * @description Grid container for horse cards with drawer state management
 * @safety GREEN
 */

'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import type { HorseWithClient, Horse } from '../domain/horse.types';
import type { Client } from '@/modules/clients/domain/client.types';
import { horseService } from '../services/horse.service';
import { clientService } from '@/modules/clients/services/client.service';
import HorseCard from './HorseCard';
import HorseDetailDrawer from './HorseDetailDrawer';

interface HorseGridProps {
  stableId: string;
  refreshKey?: number;
}

export default function HorseGrid({ stableId, refreshKey }: HorseGridProps) {
  const [horses, setHorses] = useState<HorseWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      const [horsesResult, clientsResult] = await Promise.all([
        horseService.getHorsesWithClients(stableId),
        clientService.getClientsByStable(stableId),
      ]);

      if (!horsesResult.success) {
        setError(horsesResult.error ?? 'Failed to load horses');
        setIsLoading(false);
        return;
      }

      if (!clientsResult.success) {
        setError(clientsResult.error ?? 'Failed to load clients');
        setIsLoading(false);
        return;
      }

      setHorses(horsesResult.horses ?? []);
      setClients(clientsResult.clients ?? []);
      setIsLoading(false);
    }

    fetchData();
  }, [stableId, refreshKey]);

  const handleAssignOwner = async (horseId: string, clientId: string | null) => {
    const result = await horseService.updateHorse(horseId, { client_id: clientId });

    if (result.success) {
      // Optimistically update the local state
      setHorses((prev) =>
        prev.map((horse) => {
          if (horse.id === horseId) {
            const newOwner = clients.find((c) => c.id === clientId);
            return {
              ...horse,
              client_id: clientId ?? '',
              client_name: newOwner?.name ?? null,
            };
          }
          return horse;
        })
      );
    }
  };

  const handleCardClick = (horse: HorseWithClient) => {
    setSelectedHorse(horse);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedHorse(null);
  };

  const filteredHorses = searchQuery
    ? horses.filter(
        (h) =>
          h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.breed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : horses;

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
          Add your first horse to start managing their services and assignments.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-6">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          size={18}
        />
        <input
          type="text"
          placeholder="Search horses by name, breed, or owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]/50 transition-all"
        />
      </div>

      {/* Grid */}
      {filteredHorses.length === 0 ? (
        <div className="glass-card rounded-v-card p-12 text-center">
          <p className="text-zinc-500">No horses match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHorses.map((horse) => (
            <HorseCard
              key={horse.id}
              horse={horse}
              clients={clients}
              onAssignOwner={handleAssignOwner}
              onClick={() => handleCardClick(horse)}
            />
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <HorseDetailDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        horse={selectedHorse}
        stableId={stableId}
      />
    </>
  );
}
