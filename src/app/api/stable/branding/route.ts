/**
 * @module api/stable/branding
 * @description API route for stable branding management
 * @safety RED
 */

import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';
import { stableService } from '@/modules/stable/services';
import type { UpdateStableBrandingInput } from '@/modules/stable/domain/stable.types';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// GET - Fetch current stable branding
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stableId = searchParams.get('stableId');

    if (!stableId) {
      return NextResponse.json({ error: 'stableId is required' }, { status: 400 });
    }

    const result = await stableService.getStableById(stableId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.stable) {
      return NextResponse.json({ error: 'Stable not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      stable: {
        id: result.stable.id,
        name: result.stable.name,
        logo_url: result.stable.logo_url,
        invoice_default_terms: result.stable.invoice_default_terms,
        bank_name: result.stable.bank_name,
        account_number: result.stable.account_number,
        iban: result.stable.iban,
        vat_number: result.stable.vat_number,
        swift_bic: result.stable.swift_bic,
        address: result.stable.address,
        branding_template_locked: result.stable.branding_template_locked,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT - Update stable name and/or terms
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      stableId,
      name,
      invoice_default_terms,
      bank_name,
      account_number,
      iban,
      vat_number,
      swift_bic,
      address,
      branding_template_locked,
    } = body;

    if (!stableId) {
      return NextResponse.json({ error: 'stableId is required' }, { status: 400 });
    }

    const input: UpdateStableBrandingInput = {};
    if (name !== undefined) input.name = name;
    if (invoice_default_terms !== undefined) input.invoice_default_terms = invoice_default_terms;
    if (bank_name !== undefined) input.bank_name = bank_name;
    if (account_number !== undefined) input.account_number = account_number;
    if (iban !== undefined) input.iban = iban;
    if (vat_number !== undefined) input.vat_number = vat_number;
    if (swift_bic !== undefined) input.swift_bic = swift_bic;
    if (address !== undefined) input.address = address;
    if (branding_template_locked !== undefined) input.branding_template_locked = branding_template_locked;

    const result = await stableService.updateStableBranding(stableId, input);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      stable: {
        id: result.stable!.id,
        name: result.stable!.name,
        logo_url: result.stable!.logo_url,
        invoice_default_terms: result.stable!.invoice_default_terms,
        bank_name: result.stable!.bank_name,
        account_number: result.stable!.account_number,
        iban: result.stable!.iban,
        vat_number: result.stable!.vat_number,
        swift_bic: result.stable!.swift_bic,
        address: result.stable!.address,
        branding_template_locked: result.stable!.branding_template_locked,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Upload logo
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const logo = formData.get('logo') as File | null;
    const stableId = formData.get('stableId') as string | null;

    if (!stableId) {
      return NextResponse.json({ error: 'stableId is required' }, { status: 400 });
    }

    if (!logo) {
      return NextResponse.json({ error: 'logo file is required' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(logo.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, WebP' },
        { status: 400 }
      );
    }

    // Validate file size
    if (logo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 2MB' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Generate unique filename
    const ext = logo.name.split('.').pop() || 'png';
    const filename = `${stableId}/logo-${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const arrayBuffer = await logo.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('stable-logos')
      .upload(filename, buffer, {
        contentType: logo.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('stable-logos')
      .getPublicUrl(filename);

    const logo_url = urlData.publicUrl;

    // Update stable record with new logo URL
    const result = await stableService.updateStableBranding(stableId, { logo_url });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      logo_url,
      stable: {
        id: result.stable!.id,
        name: result.stable!.name,
        logo_url: result.stable!.logo_url,
        invoice_default_terms: result.stable!.invoice_default_terms,
        bank_name: result.stable!.bank_name,
        account_number: result.stable!.account_number,
        iban: result.stable!.iban,
        vat_number: result.stable!.vat_number,
        swift_bic: result.stable!.swift_bic,
        address: result.stable!.address,
        branding_template_locked: result.stable!.branding_template_locked,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
