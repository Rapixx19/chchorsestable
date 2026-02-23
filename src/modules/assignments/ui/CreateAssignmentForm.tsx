/**
 * @module assignments/ui
 * @description Form to create a new service assignment
 * @safety GREEN
 */

'use client';

import { useState, useEffect } from 'react';
import { assignmentService } from '../services/assignment.service';
import { validateCreateAssignmentInput } from '../domain/assignment.logic';
import { clientService } from '@/modules/clients/services/client.service';
import { horseService } from '@/modules/horses/services/horse.service';
import { serviceService } from '@/modules/services/services/service.service';
import type { Client } from '@/modules/clients/domain/client.types';
import type { Horse } from '@/modules/horses/domain/horse.types';
import type { Service } from '@/modules/services/domain/service.types';

interface CreateAssignmentFormProps {
  stableId: string;
  onSuccess?: () => void;
}

export function CreateAssignmentForm({ stableId, onSuccess }: CreateAssignmentFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clientId, setClientId] = useState('');
  const [horseId, setHorseId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    async function fetchData() {
      const [clientsResult, horsesResult, servicesResult] = await Promise.all([
        clientService.getClientsByStable(stableId),
        horseService.getHorsesByStable(stableId),
        serviceService.getServicesByStable(stableId),
      ]);

      if (clientsResult.success && clientsResult.clients) {
        setClients(clientsResult.clients);
      }
      if (horsesResult.success && horsesResult.horses) {
        setHorses(horsesResult.horses);
      }
      if (servicesResult.success && servicesResult.services) {
        setServices(servicesResult.services);
      }
    }
    fetchData();
  }, [stableId]);

  // Filter horses by selected client
  const filteredHorses = clientId
    ? horses.filter((h) => h.client_id === clientId)
    : [];

  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    setHorseId(''); // Reset horse when client changes
  };

  // Filter services to non-archived only
  const availableServices = services.filter((s) => !s.archived);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const input = {
      stable_id: stableId,
      client_id: clientId,
      horse_id: horseId || null,
      service_id: serviceId,
      quantity,
      start_date: new Date(startDate),
      end_date: endDate ? new Date(endDate) : null,
      active,
    };

    const validationErrors = validateCreateAssignmentInput(input);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setIsLoading(true);

    const result = await assignmentService.createAssignment(input);

    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Failed to create assignment');
      return;
    }

    // Reset form
    setClientId('');
    setHorseId('');
    setServiceId('');
    setQuantity(1);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setActive(true);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 border rounded">
      <h2 className="text-lg font-semibold">Add Assignment</h2>

      <select
        value={clientId}
        onChange={(e) => handleClientChange(e.target.value)}
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

      <select
        value={horseId}
        onChange={(e) => setHorseId(e.target.value)}
        disabled={isLoading || !clientId}
        className="border rounded px-3 py-2"
      >
        <option value="">Select Horse (optional)</option>
        {filteredHorses.map((horse) => (
          <option key={horse.id} value={horse.id}>
            {horse.name}
          </option>
        ))}
      </select>

      <select
        value={serviceId}
        onChange={(e) => setServiceId(e.target.value)}
        disabled={isLoading}
        className="border rounded px-3 py-2"
        required
      >
        <option value="">Select Service *</option>
        {availableServices.map((service) => (
          <option key={service.id} value={service.id}>
            {service.name} - CHF {(service.price_cents / 100).toFixed(2)}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
          disabled={isLoading}
          className="border rounded px-3 py-2 w-24"
          placeholder="Qty"
        />
        <span className="self-center text-gray-600">Quantity</span>
      </div>

      <div className="flex gap-2 items-center">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={isLoading}
          className="border rounded px-3 py-2"
          required
        />
        <span className="text-gray-600">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          disabled={isLoading}
          className="border rounded px-3 py-2"
          placeholder="End date (optional)"
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          disabled={isLoading}
        />
        <span>Active</span>
      </label>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Add Assignment'}
      </button>
    </form>
  );
}
