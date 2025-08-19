import VehicleMap from "@/components/vehicle-map";

export default function Home() {
  // Dummy data for stolen vehicles
  const stolenVehicles = [
    { id: '1', lat: 34.052235, lng: -118.243683, make: 'Honda', model: 'Civic', year: 2022, color: 'Black', licensePlate: '8ABC123' },
    { id: '2', lat: 40.712776, lng: -74.005974, make: 'Toyota', model: 'Camry', year: 2021, color: 'Silver', licensePlate: 'FGH456' },
    { id: '3', lat: 41.878113, lng: -87.629799, make: 'Ford', model: 'F-150', year: 2023, color: 'Blue', licensePlate: 'TRK789' },
  ];

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full">
      <VehicleMap vehicles={stolenVehicles} />
    </div>
  );
}
