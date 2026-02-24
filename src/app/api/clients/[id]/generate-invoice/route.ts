/**
 * @module api/clients/generate-invoice
 * @description API route for generating an invoice for a specific client
 * @safety RED
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infra/supabase/server';
import {
  createInvoiceLinesFromAssignments,
} from '@/modules/billing/domain/billing.logic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const supabase = await createClient();

    // 1. Verify client exists and get stable_id
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, stable_id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const stable_id = client.stable_id;

    // 2. Fetch active assignments for this client
    const { data: assignments, error: assignmentsError } = await supabase
      .from('service_assignments')
      .select('id, stable_id, client_id, horse_id, service_id, quantity, active')
      .eq('client_id', clientId)
      .eq('stable_id', stable_id)
      .eq('active', true);

    if (assignmentsError) {
      return NextResponse.json(
        { error: assignmentsError.message },
        { status: 500 }
      );
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json(
        { error: 'Client has no active services to invoice' },
        { status: 400 }
      );
    }

    // 3. Fetch services
    const serviceIds = [...new Set(assignments.map((a) => a.service_id))];
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, billing_unit, price_cents')
      .in('id', serviceIds);

    if (servicesError) {
      return NextResponse.json(
        { error: servicesError.message },
        { status: 500 }
      );
    }

    // 4. Fetch horses (only those in assignments)
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
        return NextResponse.json(
          { error: horsesError.message },
          { status: 500 }
        );
      }
      horses = horseData || [];
    }

    // 5. Call domain logic to create invoice lines
    const lines = createInvoiceLinesFromAssignments({
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

    if (lines.length === 0) {
      return NextResponse.json(
        { error: 'No invoice lines could be generated' },
        { status: 400 }
      );
    }

    // 6. Calculate totals
    const subtotal_cents = lines.reduce((sum, line) => sum + line.line_total_cents, 0);
    const total_cents = subtotal_cents;

    if (total_cents < 0) {
      return NextResponse.json(
        { error: 'Cannot create invoice with negative total' },
        { status: 400 }
      );
    }

    // 7. Insert invoice
    const { data: insertedInvoice, error: invoiceInsertError } = await supabase
      .from('invoices')
      .insert({
        stable_id,
        client_id: clientId,
        subtotal_cents,
        total_cents,
        status: 'draft',
      })
      .select('id')
      .single();

    if (invoiceInsertError || !insertedInvoice) {
      return NextResponse.json(
        { error: invoiceInsertError?.message ?? 'Failed to create invoice' },
        { status: 500 }
      );
    }

    // 8. Insert invoice lines
    const linesToInsert = lines.map((line) => ({
      invoice_id: insertedInvoice.id,
      description: line.description,
      billing_unit: line.billing_unit,
      quantity: line.quantity,
      unit_price_cents: line.unit_price_cents,
      line_total_cents: line.line_total_cents,
      horse_id: line.horse_id ?? null,
      service_id: line.service_id ?? null,
    }));

    const { error: linesInsertError } = await supabase
      .from('invoice_lines')
      .insert(linesToInsert);

    if (linesInsertError) {
      // Clean up the invoice if lines failed
      await supabase.from('invoices').delete().eq('id', insertedInvoice.id);
      return NextResponse.json(
        { error: linesInsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice_id: insertedInvoice.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
