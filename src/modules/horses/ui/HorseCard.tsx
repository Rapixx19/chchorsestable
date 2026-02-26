/**
 * @module horses/ui
 * @description Premium glass card component for displaying horse information
 * @safety GREEN
 */

'use client';

import { Rabbit } from 'lucide-react';
import type { HorseWithClient } from '../domain/horse.types';
import type { Client } from '@/modules/clients/domain/client.types';
import OwnerAssignDropdown from './OwnerAssignDropdown';

interface HorseCardProps {
  horse: HorseWithClient;
  clients: Client[];
  onAssignOwner: (horseId: string, clientId: string | null) => void;
  onClick: () => void;
}

export default function HorseCard({
  horse,
  clients,
  onAssignOwner,
  onClick,
}: HorseCardProps) {
  const handleAssign = (clientId: string | null) => {
    onAssignOwner(horse.id, clientId);
  };

  return (
    <div
      onClick={onClick}
      className="glass-card rounded-v-card p-5 border border-white/10
        hover:scale-[1.02] hover:border-[#D4AF37]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]
        transition-all duration-300 cursor-pointer group"
    >
      {/* Header with icon and dropdown */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center
          group-hover:bg-zinc-700 transition-colors">
          <Rabbit className="text-[#D4AF37]" size={20} />
        </div>
        <OwnerAssignDropdown
          clients={clients}
          currentOwnerId={horse.client_id}
          onAssign={handleAssign}
        />
      </div>

      {/* Horse name */}
      <h3 className="text-xl font-bold text-white mb-2 truncate">
        {horse.name}
      </h3>

      {/* Horse details */}
      <div className="text-sm text-zinc-400 mb-4">
        {horse.breed && <span>{horse.breed}</span>}
        {horse.breed && horse.birth_year && <span className="mx-2">|</span>}
        {horse.birth_year && <span>Born: {horse.birth_year}</span>}
        {!horse.breed && !horse.birth_year && (
          <span className="text-zinc-600">No details</span>
        )}
      </div>

      {/* Owner badge */}
      {horse.client_name ? (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span className="text-xs text-zinc-400">Owner:</span>
          <span className="text-sm text-white font-medium truncate max-w-[150px]">
            {horse.client_name}
          </span>
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30">
          <span className="text-sm text-[#D4AF37] font-medium">
            ⚠️ Unassigned
          </span>
        </div>
      )}
    </div>
  );
}
