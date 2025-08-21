
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// By removing `ssr: false`, we allow Next.js to pre-render the static parts of the form on the server.
// The interactive client-side logic will still hydrate in the browser, but the initial HTML is delivered faster.
const VehicleReportForm = dynamic(
  () => import('@/components/vehicle-report-form').then((mod) => mod.VehicleReportForm),
  {
    loading: () => <div className="p-8"><Skeleton className="h-[500px] w-full" /></div>,
     ssr: false
  }
);

export function VehicleReportFormLoader() {
  return <VehicleReportForm />;
}
