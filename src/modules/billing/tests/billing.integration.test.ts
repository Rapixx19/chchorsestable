/**
 * @module billing/tests
 * @description Integration tests for billing service
 * @safety RED
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test data
const mockBillingPeriod = {
  id: 'period-123',
  stable_id: 'stable-123',
  status: 'pending',
};

const mockAssignments = [
  {
    id: 'assign-1',
    stable_id: 'stable-123',
    client_id: 'client-1',
    horse_id: 'horse-1',
    service_id: 'service-1',
    quantity: 1,
    active: true,
  },
  {
    id: 'assign-2',
    stable_id: 'stable-123',
    client_id: 'client-2',
    horse_id: null,
    service_id: 'service-2',
    quantity: 2,
    active: true,
  },
  {
    id: 'assign-3',
    stable_id: 'stable-123',
    client_id: 'client-1',
    horse_id: null,
    service_id: 'service-2',
    quantity: 1,
    active: false, // Inactive assignment - should be skipped
  },
];

const mockServices = [
  {
    id: 'service-1',
    name: 'Monthly Boarding',
    billing_unit: 'monthly',
    price_cents: 50000,
  },
  {
    id: 'service-2',
    name: 'Training Session',
    billing_unit: 'per_session',
    price_cents: 7500,
  },
];

const mockHorses = [
  {
    id: 'horse-1',
    name: 'Thunder',
  },
];

const mockClients = [
  {
    id: 'client-1',
    name: 'John Doe',
  },
  {
    id: 'client-2',
    name: 'Jane Smith',
  },
];

const mockInsertedInvoices = [
  { id: 'invoice-1', client_id: 'client-1' },
  { id: 'invoice-2', client_id: 'client-2' },
];

// Mock supabase with configurable responses
let mockTableData: Record<string, { data: unknown; error: unknown }> = {};
let capturedInvoiceInsert: unknown = null;
let periodUpdateCalled = false;

// Create a recursive eq chain that always returns the final result
function createEqChain(getResponse: () => { data: unknown; error: unknown }) {
  const chainFn = (): unknown => ({
    eq: vi.fn(chainFn),
    single: vi.fn(() => Promise.resolve(getResponse())),
    order: vi.fn(() => Promise.resolve(getResponse())),
    then: (resolve: (value: unknown) => unknown) => resolve(getResponse()),
  });
  return vi.fn(chainFn);
}

vi.mock('@/infra/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      // Create a fluent mock that returns proper data based on table
      const getResponse = () => mockTableData[table] || { data: null, error: null };

      // For invoices table, capture insert data
      if (table === 'invoices') {
        return {
          insert: vi.fn((data: unknown) => {
            capturedInvoiceInsert = data;
            return {
              select: vi.fn(() => Promise.resolve(getResponse())),
            };
          }),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        };
      }

      // For invoice_lines table
      if (table === 'invoice_lines') {
        return {
          insert: vi.fn(() => Promise.resolve(getResponse())),
        };
      }

      // For billing_periods table
      if (table === 'billing_periods') {
        return {
          select: vi.fn(() => ({
            eq: createEqChain(getResponse),
          })),
          update: vi.fn(() => {
            periodUpdateCalled = true;
            return {
              eq: vi.fn(() => Promise.resolve({ error: null })),
            };
          }),
        };
      }

      // For other tables (service_assignments, services, horses, clients)
      // These need to support variable chain lengths
      return {
        select: vi.fn(() => ({
          eq: createEqChain(getResponse),
        })),
      };
    }),
  },
}));

import { billingService } from '../services/billing.service';

describe('billingService.generateInvoicesForPeriod', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTableData = {};
    capturedInvoiceInsert = null;
    periodUpdateCalled = false;
  });

  it('generates invoices successfully', async () => {
    mockTableData = {
      billing_periods: { data: mockBillingPeriod, error: null },
      service_assignments: { data: mockAssignments, error: null },
      services: { data: mockServices, error: null },
      horses: { data: mockHorses, error: null },
      clients: { data: mockClients, error: null },
      invoices: { data: mockInsertedInvoices, error: null },
      invoice_lines: { data: [], error: null },
    };

    const result = await billingService.generateInvoicesForPeriod({
      stable_id: 'stable-123',
      billing_period_id: 'period-123',
    });

    expect(result.success).toBe(true);
    expect(result.invoices_created).toBe(2);
  });

  it('throws error if billing period not found', async () => {
    mockTableData = {
      billing_periods: { data: null, error: { message: 'Not found' } },
    };

    const result = await billingService.generateInvoicesForPeriod({
      stable_id: 'stable-123',
      billing_period_id: 'nonexistent-period',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Billing period not found');
  });

  it('skips inactive assignments', async () => {
    // All assignments inactive
    const inactiveAssignments = mockAssignments.map((a) => ({
      ...a,
      active: false,
    }));

    mockTableData = {
      billing_periods: { data: mockBillingPeriod, error: null },
      service_assignments: { data: inactiveAssignments, error: null },
      services: { data: mockServices, error: null },
      horses: { data: mockHorses, error: null },
      clients: { data: mockClients, error: null },
    };

    const result = await billingService.generateInvoicesForPeriod({
      stable_id: 'stable-123',
      billing_period_id: 'period-123',
    });

    expect(result.success).toBe(true);
    expect(result.invoices_created).toBe(0);
  });

  it('creates correct invoice totals', async () => {
    // Single assignment for verification
    const singleAssignment = [
      {
        id: 'assign-1',
        stable_id: 'stable-123',
        client_id: 'client-1',
        horse_id: 'horse-1',
        service_id: 'service-1',
        quantity: 2, // 2 x 50000 = 100000 cents
        active: true,
      },
    ];

    mockTableData = {
      billing_periods: { data: mockBillingPeriod, error: null },
      service_assignments: { data: singleAssignment, error: null },
      services: { data: mockServices, error: null },
      horses: { data: mockHorses, error: null },
      clients: { data: mockClients, error: null },
      invoices: { data: [{ id: 'invoice-1', client_id: 'client-1' }], error: null },
      invoice_lines: { data: [], error: null },
    };

    const result = await billingService.generateInvoicesForPeriod({
      stable_id: 'stable-123',
      billing_period_id: 'period-123',
    });

    expect(result.success).toBe(true);
    expect(capturedInvoiceInsert).toBeDefined();
    const insertedInvoices = capturedInvoiceInsert as Array<{
      subtotal_cents: number;
      total_cents: number;
    }>;
    expect(insertedInvoices[0].subtotal_cents).toBe(100000);
    expect(insertedInvoices[0].total_cents).toBe(100000);
  });

  it('updates billing period status', async () => {
    mockTableData = {
      billing_periods: { data: mockBillingPeriod, error: null },
      service_assignments: { data: mockAssignments.filter((a) => a.active), error: null },
      services: { data: mockServices, error: null },
      horses: { data: mockHorses, error: null },
      clients: { data: mockClients, error: null },
      invoices: { data: mockInsertedInvoices, error: null },
      invoice_lines: { data: [], error: null },
    };

    const result = await billingService.generateInvoicesForPeriod({
      stable_id: 'stable-123',
      billing_period_id: 'period-123',
    });

    expect(result.success).toBe(true);
    expect(periodUpdateCalled).toBe(true);
  });

  it('returns zero invoices when no assignments exist', async () => {
    mockTableData = {
      billing_periods: { data: mockBillingPeriod, error: null },
      service_assignments: { data: [], error: null },
    };

    const result = await billingService.generateInvoicesForPeriod({
      stable_id: 'stable-123',
      billing_period_id: 'period-123',
    });

    expect(result.success).toBe(true);
    expect(result.invoices_created).toBe(0);
  });
});
