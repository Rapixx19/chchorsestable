/**
 * @module horses/ui
 * @description Searchable dropdown for assigning/reassigning horse owners
 * @safety GREEN
 */

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, UserMinus } from 'lucide-react';
import type { Client } from '@/modules/clients/domain/client.types';

interface OwnerAssignDropdownProps {
  clients: Client[];
  currentOwnerId: string | null;
  onAssign: (clientId: string | null) => void;
  disabled?: boolean;
}

export default function OwnerAssignDropdown({
  clients,
  currentOwnerId,
  onAssign,
  disabled = false,
}: OwnerAssignDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter((client) =>
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  const currentOwner = clients.find((c) => c.id === currentOwnerId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      inputRef.current?.focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (clientId: string | null) => {
    onAssign(clientId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setIsOpen(!isOpen);
        }}
        disabled={disabled}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-white/10
          hover:border-[#D4AF37]/30 hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-zinc-400">
          {currentOwner ? 'Reassign' : 'Assign'}
        </span>
        <ChevronDown size={12} className="text-zinc-500" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                size={14}
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]/50"
              />
            </div>
          </div>

          {/* Client list */}
          <div className="max-h-48 overflow-y-auto">
            {/* Remove owner option if currently assigned */}
            {currentOwnerId && (
              <button
                onClick={() => handleSelect(null)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors flex items-center gap-2 text-amber-400 border-b border-white/5"
              >
                <UserMinus size={14} />
                <span>Remove Owner</span>
              </button>
            )}

            {filteredClients.length === 0 ? (
              <p className="px-3 py-4 text-sm text-zinc-500 text-center">
                {searchQuery ? 'No clients match your search.' : 'No clients available.'}
              </p>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelect(client.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors flex items-center justify-between group"
                >
                  <span className="text-zinc-300 group-hover:text-white truncate">
                    {client.name}
                  </span>
                  {client.id === currentOwnerId && (
                    <Check size={14} className="text-[#D4AF37] shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
