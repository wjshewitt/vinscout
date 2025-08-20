
'use client';

import VehicleMap from "@/components/vehicle-map";
import { VehicleInfoPanel } from "@/components/vehicle-info-panel";
import { MapControls } from "@/components/map-controls";
import { useState, useEffect, useMemo } from "react";
import { listenToVehicleReports, VehicleReport } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export default function MapPage() {
    const [reports, setReports] = useState<VehicleReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleReport | null>(null);
    const [filterStatus, setFilterStatus] = useState<'Active' | 'Recovered' | 'All'>('Active');

    useEffect(() => {
        setLoading(true);
        const unsubscribe = listenToVehicleReports((fetchedReports) => {
            setReports(fetchedReports.filter(r => r.lat && r.lng));
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const handleVehicleSelect = (vehicle: VehicleReport | null) => {
        setSelectedVehicle(vehicle);
    };

    const filteredVehicles = useMemo(() => {
        if (filterStatus === 'All') {
            return reports;
        }
        return reports.filter(v => v.status === filterStatus);
    }, [reports, filterStatus]);

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
                vehicles={filteredVehicles} 
                onVehicleSelect={handleVehicleSelect} 
                selectedVehicleId={selectedVehicle?.id} 
            />
            <MapControls
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
            />
            <VehicleInfoPanel 
                vehicle={selectedVehicle} 
                onClose={() => handleVehicleSelect(null)} 
            />
        </div>
    )
}
