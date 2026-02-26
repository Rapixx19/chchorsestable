/**
 * @module api/services/parse-pdf
 * @description API endpoint for PyMuPDF-based PDF parsing of service catalogs
 * @safety RED
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { createClient } from '@/infra/supabase/server';

interface ParsedServiceFromPython {
  name: string;
  price_cents: number;
  billing_unit: string;
  tax_rate: number | null;
  duration_text: string | null;
  notes: string | null;
  confidence: number;
}

interface PythonParserResult {
  success: boolean;
  services?: ParsedServiceFromPython[];
  count?: number;
  method?: string;
  error?: string;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const PYTHON_TIMEOUT_MS = 30000; // 30 seconds

export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Verify user has a stable
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

  // 3. Parse FormData and extract PDF file
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Invalid form data' },
      { status: 400 }
    );
  }

  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json(
      { error: 'No file provided' },
      { status: 400 }
    );
  }

  // 4. Validate file
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json(
      { error: 'File must be a PDF' },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB` },
      { status: 400 }
    );
  }

  // 5. Save to temp file
  const tempPath = join(tmpdir(), `pdf-import-${randomUUID()}.pdf`);
  let buffer: Buffer;

  try {
    buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tempPath, buffer);
  } catch {
    return NextResponse.json(
      { error: 'Failed to process uploaded file' },
      { status: 500 }
    );
  }

  try {
    // 6. Call Python parser
    const result = await runPythonParser(tempPath);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'PDF parsing failed' },
        { status: 400 }
      );
    }

    // 7. Return parsed services
    return NextResponse.json({
      success: true,
      services: result.services || [],
      count: result.count || 0,
      method: result.method || 'unknown',
      stable_id: stable.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Parser error: ${message}` },
      { status: 500 }
    );
  } finally {
    // 8. Cleanup temp file
    await unlink(tempPath).catch(() => {
      // Ignore cleanup errors
    });
  }
}

/**
 * Execute the Python PDF parser script.
 */
function runPythonParser(pdfPath: string): Promise<PythonParserResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(process.cwd(), 'scripts', 'pdf_parser.py');

    // Try python3 first, fall back to python
    const python = spawn('python3', [scriptPath, pdfPath], {
      timeout: PYTHON_TIMEOUT_MS,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('error', (err) => {
      // If python3 fails, try with python
      if (err.message.includes('ENOENT')) {
        const pythonFallback = spawn('python', [scriptPath, pdfPath], {
          timeout: PYTHON_TIMEOUT_MS,
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        });

        let fallbackStdout = '';
        let fallbackStderr = '';

        pythonFallback.stdout.on('data', (data) => {
          fallbackStdout += data.toString();
        });

        pythonFallback.stderr.on('data', (data) => {
          fallbackStderr += data.toString();
        });

        pythonFallback.on('error', (fallbackErr) => {
          reject(new Error(`Python not found: ${fallbackErr.message}`));
        });

        pythonFallback.on('close', (code) => {
          handlePythonResult(code, fallbackStdout, fallbackStderr, resolve, reject);
        });

        return;
      }
      reject(err);
    });

    python.on('close', (code) => {
      handlePythonResult(code, stdout, stderr, resolve, reject);
    });
  });
}

function handlePythonResult(
  code: number | null,
  stdout: string,
  stderr: string,
  resolve: (value: PythonParserResult) => void,
  reject: (reason: Error) => void
) {
  if (code !== 0) {
    // Check if it's a known error in stdout (parser returns JSON even on error)
    try {
      const errorResult = JSON.parse(stdout);
      if (errorResult.error) {
        resolve({ success: false, error: errorResult.error });
        return;
      }
    } catch {
      // Not JSON, use stderr
    }
    reject(new Error(stderr || `Python parser exited with code ${code}`));
    return;
  }

  try {
    const result = JSON.parse(stdout);
    resolve(result);
  } catch {
    reject(new Error('Invalid JSON response from parser'));
  }
}
