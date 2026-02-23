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

const BILLING_UNIT_LABELS: Record<Service['billing_unit'], string> = {
  one_time: 'One-time',
  monthly: '/month',
  per_session: '/session',
};

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
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
            <span>
              CHF {formatPrice(service.price_cents)}
              {service.billing_unit !== 'one_time' && ` ${BILLING_UNIT_LABELS[service.billing_unit]}`}
            </span>
            {service.archived && <span>(Archived)</span>}
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
