/**
 * @module invoices/services
 * @description Invoice preview generation service
 * @safety YELLOW
 */

import { createClient } from '@/infra/supabase/server';
import { createInvoiceLinesFromAssignments } from '@/modules/billing/domain/billing.logic';
import type { InvoicePreviewResult, InvoicePreviewData, InvoicePreviewLine } from '../domain/invoicePreview.types';

export async function generateInvoicePreview(clientId: string): Promise<InvoicePreviewResult> {
  try {
    const supabase = await createClient();

    // 1. Fetch client with stable branding
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, email, address, stable_id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return { success: false, error: 'Client not found' };
    }

    // 2. Fetch stable branding
    const { data: stable, error: stableError } = await supabase
      .from('stables')
      .select(`
        id, name, logo_url, address, vat_number,
        bank_name, account_number, iban, swift_bic,
        invoice_default_terms, branding_template_locked
      `)
      .eq('id', client.stable_id)
      .single();

    if (stableError || !stable) {
      return { success: false, error: 'Stable not found' };
    }

    // 3. Fetch active assignments for this client
    const { data: assignments, error: assignmentsError } = await supabase
      .from('service_assignments')
      .select('id, stable_id, client_id, horse_id, service_id, quantity, active')
      .eq('client_id', clientId)
      .eq('stable_id', client.stable_id)
      .eq('active', true);

    if (assignmentsError) {
      return { success: false, error: assignmentsError.message };
    }

    if (!assignments || assignments.length === 0) {
      return { success: false, error: 'No active services to invoice' };
    }

    // 4. Fetch services
    const serviceIds = [...new Set(assignments.map((a) => a.service_id))];
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, billing_unit, price_cents')
      .in('id', serviceIds);

    if (servicesError) {
      return { success: false, error: servicesError.message };
    }

    // 5. Fetch horses (only those in assignments)
    const horseIds = assignments
      .filter((a) => a.horse_id)
      .map((a) => a.horse_id as string);

    let horses: { id: string; name: string }[] = [];
    if (horseIds.length > 0) {
      const { data: horseData, error: horsesError } = await supabase
        .from('horses')
        .select('id, name')
        .in('id', horseIds);

      if (horsesError) {
        return { success: false, error: horsesError.message };
      }
      horses = horseData || [];
    }

    // 6. Create invoice lines using domain logic
    const lineDrafts = createInvoiceLinesFromAssignments({
      assignments: assignments.map((a) => ({
        id: a.id,
        stable_id: a.stable_id,
        client_id: a.client_id,
        horse_id: a.horse_id ?? null,
        service_id: a.service_id,
        quantity: a.quantity,
        active: a.active,
      })),
      services: (services || []).map((s) => ({
        id: s.id,
        name: s.name,
        billing_unit: s.billing_unit,
        price_cents: s.price_cents,
      })),
      horses: horses.map((h) => ({
        id: h.id,
        name: h.name,
      })),
      clients: [{ id: client.id, name: client.name }],
    });

    if (lineDrafts.length === 0) {
      return { success: false, error: 'No invoice lines could be generated' };
    }

    // 7. Create lookup maps for names
    const serviceMap = new Map((services || []).map((s) => [s.id, s.name]));
    const horseMap = new Map(horses.map((h) => [h.id, h.name]));

    // 8. Build preview lines
    const previewLines: InvoicePreviewLine[] = lineDrafts.map((draft) => ({
      description: draft.description,
      quantity: draft.quantity,
      unit_price_cents: draft.unit_price_cents,
      line_total_cents: draft.line_total_cents,
      service_name: draft.service_id ? (serviceMap.get(draft.service_id) || 'Unknown') : 'Unknown',
      horse_name: draft.horse_id ? horseMap.get(draft.horse_id) : undefined,
    }));

    // 9. Calculate totals
    const subtotal_cents = previewLines.reduce((sum, line) => sum + line.line_total_cents, 0);
    const total_cents = subtotal_cents;

    // 10. Build preview data
    const preview: InvoicePreviewData = {
      client: {
        id: client.id,
        name: client.name,
        email: client.email ?? undefined,
        address: client.address ?? undefined,
      },
      stable: {
        id: stable.id,
        name: stable.name,
        logo_url: stable.logo_url ?? undefined,
        address: stable.address ?? undefined,
        vat_number: stable.vat_number ?? undefined,
        bank_name: stable.bank_name ?? undefined,
        account_number: stable.account_number ?? undefined,
        iban: stable.iban ?? undefined,
        swift_bic: stable.swift_bic ?? undefined,
        invoice_default_terms: stable.invoice_default_terms ?? undefined,
        branding_template_locked: stable.branding_template_locked ?? undefined,
      },
      lines: previewLines,
      subtotal_cents,
      total_cents,
      generated_at: new Date().toISOString(),
    };

    return { success: true, preview };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}
