'use client';

import { APIProvider } from '@vis.gl/react-google-maps';
import { ReactNode } from 'react';

export function MapProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 text-gray-800">
        <div className="max-w-md p-6 text-center bg-white rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-2">API Key Missing</h2>
          <p>Please check your <code className="bg-gray-200 px-1 py-0.5 rounded">.env.local</code> file.</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['places']}>
      {children}
    </APIProvider>
  );
}
