
'use client';

import VehicleMap from "@/components/vehicle-map";
import { VehicleInfoPanel } from "@/components/vehicle-info-panel";
import { useState, useEffect } from "react";
import { getVehicleReports, VehicleReport } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export default function MapPage() {
    const [reports, setReports] = useState<VehicleReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleReport | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            const fetchedReports = await getVehicleReports();
            setReports(fetchedReports.filter(r => r.lat && r.lng));
            setLoading(false);
        };
        fetchReports();
    }, []);

    const handleVehicleSelect = (vehicle: VehicleReport | null) => {
        setSelectedVehicle(vehicle);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        )
    }

    return (
        <div className="relative h-[calc(100vh-4rem)] w-full">
            <VehicleMap 
                vehicles={reports} 
                onVehicleSelect={handleVehicleSelect} 
                selectedVehicleId={selectedVehicle?.id} 
            />
            <VehicleInfoPanel 
                vehicle={selectedVehicle} 
                onClose={() => handleVehicleSelect(null)} 
            />
        </div>
    )
}
