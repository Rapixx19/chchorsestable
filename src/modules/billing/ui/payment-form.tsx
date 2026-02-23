/**
 * @module billing/ui
 * @description Payment form component
 * @safety RED
 */

'use client';

import { useState } from 'react';
import type { CreatePaymentInput, PaymentMethod } from '../domain/billing.types';
import { validateCreatePaymentInput } from '../domain/billing.logic';

interface PaymentFormProps {
  invoiceId: string;
  amountDue: number;
  onSubmit: (input: CreatePaymentInput) => Promise<void>;
}

export function PaymentForm({ invoiceId, amountDue, onSubmit }: PaymentFormProps) {
  const [amount, setAmount] = useState(amountDue);
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: CreatePaymentInput = { invoiceId, amount, method };

    const validationErrors = validateCreatePaymentInput(input);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setIsLoading(true);

    try {
      await onSubmit(input);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="method">Payment Method</label>
        <select
          id="method"
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          disabled={isLoading}
        >
          <option value="card">Card</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </div>
      {errors.length > 0 && (
        <ul>
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Pay'}
      </button>
    </form>
  );
}
