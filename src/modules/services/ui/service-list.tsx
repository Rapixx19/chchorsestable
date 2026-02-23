/**
 * @module services/ui
 * @description Service list component
 * @safety YELLOW
 */

'use client';

import type { Service } from '../domain/service.types';

interface ServiceListProps {
  services: Service[];
  onSelect?: (service: Service) => void;
  onDelete?: (service: Service) => void;
}

export function ServiceList({ services, onSelect, onDelete }: ServiceListProps) {
  if (services.length === 0) {
    return <p>No services found.</p>;
  }

  return (
    <ul>
      {services.map((service) => (
        <li key={service.id}>
          <div>
            <strong>{service.name}</strong>
            <span>${service.price.toFixed(2)}</span>
            {!service.active && <span>(Inactive)</span>}
          </div>
          <div>
            {onSelect && (
              <button onClick={() => onSelect(service)}>View</button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(service)}>Delete</button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
