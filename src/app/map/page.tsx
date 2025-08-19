
'use client';

import VehicleMap from "@/components/vehicle-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { getVehicleReports, VehicleReport } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export default function MapPage() {
    const [reports, setReports] = useState<VehicleReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            const fetchedReports = await getVehicleReports();
            setReports(fetchedReports);
            setLoading(false);
        };
        fetchReports();
    }, []);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
        <VehicleMap vehicles={reports.filter(r => r.lat && r.lng)} />
    </div>
  )
}
