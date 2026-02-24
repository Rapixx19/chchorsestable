/**
 * @module app/services/import
 * @description Page for importing services from PDF
 * @safety GREEN
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ImportServicesFromPdf, ReviewImportedServices } from '@/modules/imports/ui';
import type { ImportJob, ParsedServicesResult, ParsedServiceCandidate } from '@/modules/imports/domain/imports.types';
import { serviceService } from '@/modules/services/services/service.service';
import { stableService } from '@/modules/stable/services/stable.service';
import { authService } from '@/modules/auth/services/auth.service';
import type { CreateServiceInput } from '@/modules/services/domain/service.types';

type PageState = 'loading' | 'upload' | 'review' | 'success' | 'error';

interface User {
  id: string;
}

export default function ImportServicesPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [stableId, setStableId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedServicesResult | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    async function loadStable() {
      const userResult = await authService.getCurrentUser();
      if (!userResult.success || !userResult.user) {
        router.push('/login');
        return;
      }

      const user = userResult.user as User;
      const stableResult = await stableService.getStableByOwnerId(user.id);

      if (!stableResult.success) {
        setError(stableResult.error || 'Failed to load stable');
        setPageState('error');
        return;
      }

      if (!stableResult.stable) {
        router.push('/onboarding');
        return;
      }

      setStableId(stableResult.stable.id);
      setPageState('upload');
    }

    loadStable();
  }, [router]);

  const handleImportComplete = useCallback((_job: ImportJob, result: ParsedServicesResult) => {
    setParsedResult(result);
    setPageState('review');
  }, []);

  const handleSave = useCallback(async (candidates: ParsedServiceCandidate[]) => {
    if (!stableId) return;

    const inputs: CreateServiceInput[] = candidates.map((c) => ({
      stable_id: stableId,
      name: c.name,
      description: c.notes,
      price_cents: c.price_cents,
      billing_unit: c.billing_unit,
    }));

    const result = await serviceService.bulkCreateServices(inputs);

    if (!result.success) {
      setError(result.error || 'Failed to save services');
      return;
    }

    setSavedCount(result.services?.length || 0);
    setPageState('success');
  }, [stableId]);

  const handleCancel = useCallback(() => {
    setParsedResult(null);
    setPageState('upload');
  }, []);

  const handleReset = useCallback(() => {
    setParsedResult(null);
    setSavedCount(0);
    setPageState('upload');
  }, []);

  if (pageState === 'loading') {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </div>
      </main>
    );
  }

  if (pageState === 'error') {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="border rounded-lg p-6 bg-red-50 text-center">
            <h1 className="text-lg font-semibold text-red-800">Error</h1>
            <p className="text-red-600 mt-2">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Import Services</h1>
          <p className="text-gray-500 mt-1">
            Upload a PDF containing your service catalog to automatically extract services.
          </p>
        </div>

        {pageState === 'upload' && stableId && (
          <ImportServicesFromPdf
            stableId={stableId}
            onImportComplete={handleImportComplete}
          />
        )}

        {pageState === 'review' && parsedResult && (
          <ReviewImportedServices
            candidates={parsedResult.candidates}
            stableId={stableId}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {pageState === 'success' && (
          <div className="border rounded-lg p-6 bg-green-50 text-center">
            <svg
              className="w-12 h-12 text-green-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h2 className="text-lg font-semibold text-green-800">
              {savedCount} Service{savedCount !== 1 ? 's' : ''} Added to Catalog
            </h2>
            <p className="text-green-600 mt-2">
              Your services have been saved and are now available in your catalog.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Import more
              </button>
              <button
                onClick={() => router.push('/services')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                View Catalog
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
