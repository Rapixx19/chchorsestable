/**
 * @module api/services/import
 * @description API route for bulk CSV service import
 * @safety RED
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infra/supabase/server';
import { importService } from '@/modules/services/services';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get user's stable_id
    const { data: stable, error: stableError } = await supabase
      .from('stables')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (stableError || !stable) {
      return NextResponse.json(
        { error: 'No stable found for user' },
        { status: 404 }
      );
    }

    const stableId = stable.id;

    // 3. Parse FormData and extract CSV file
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'CSV file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['text/csv', 'application/csv', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      );
    }

    // 4. Read file content
    const content = await file.text();

    if (!content.trim()) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // 5. Parse CSV
    const parsedRows = importService.parseCSV(content);

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows found. Ensure CSV has headers: name, price, unit' },
        { status: 400 }
      );
    }

    // 6. Validate rows
    const { validRows, errors } = importService.validateRows(parsedRows);

    // If all rows have errors, return early with validation errors
    if (validRows.length === 0) {
      return NextResponse.json({
        success: false,
        imported: 0,
        errors,
      });
    }

    // 7. Import valid services
    const result = await importService.importServices(validRows, stableId);

    // Combine import errors with validation errors
    const allErrors = [...errors, ...result.errors];

    return NextResponse.json({
      success: result.success,
      imported: result.imported,
      errors: allErrors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
