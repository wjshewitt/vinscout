
'use client';

import { AuthProvider } from '@/hooks/use-auth';
import { APIProvider } from '@vis.gl/react-google-maps';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
      <AuthProvider>
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['drawing', 'places']}>
            {children}
        </APIProvider>
      </AuthProvider>
  );
}
