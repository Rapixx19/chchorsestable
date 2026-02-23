/**
 * @module invoices/ui
 * @description Invoice list component
 * @safety RED
 */

'use client';

import type { Invoice } from '../domain/invoice.types';

interface InvoiceListProps {
  invoices: Invoice[];
  onSelect?: (invoice: Invoice) => void;
  onSend?: (invoice: Invoice) => void;
}

const statusColors: Record<Invoice['status'], string> = {
  draft: 'gray',
  sent: 'blue',
  paid: 'green',
  overdue: 'red',
  cancelled: 'gray',
};

export function InvoiceList({ invoices, onSelect, onSend }: InvoiceListProps) {
  if (invoices.length === 0) {
    return <p>No invoices found.</p>;
  }

  return (
    <ul>
      {invoices.map((invoice) => (
        <li key={invoice.id}>
          <div>
            <strong>{invoice.invoiceNumber}</strong>
            <span style={{ color: statusColors[invoice.status] }}>{invoice.status}</span>
            <span>${invoice.total.toFixed(2)}</span>
          </div>
          <div>
            {onSelect && (
              <button onClick={() => onSelect(invoice)}>View</button>
            )}
            {onSend && invoice.status === 'draft' && (
              <button onClick={() => onSend(invoice)}>Send</button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
