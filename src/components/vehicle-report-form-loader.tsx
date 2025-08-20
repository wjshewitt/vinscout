'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const VehicleReportForm = dynamic(
  () => import('@/components/vehicle-report-form').then((mod) => mod.VehicleReportForm),
  {
    ssr: false,
    loading: () => <div className="p-8"><Skeleton className="h-[500px] w-full" /></div>,
  }
);

export function VehicleReportFormLoader() {
  return <VehicleReportForm />;
}
