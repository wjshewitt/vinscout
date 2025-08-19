import VehicleMap from "@/components/vehicle-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MapPage() {
    const stolenVehicles = [
    { id: '1', lat: 51.5074, lng: -0.1278, make: 'Ford', model: 'Fiesta', year: 2019, color: 'Red', licensePlate: 'AB19 CDE', lastSeen: 'Central London', photo: 'https://placehold.co/400x300.png' },
    { id: '2', lat: 53.4808, lng: -2.2426, make: 'Vauxhall', model: 'Corsa', year: 2021, color: 'Grey', licensePlate: 'GH21 IJK', lastSeen: 'Manchester City Centre', photo: 'https://placehold.co/400x300.png' },
    { id: '3', lat: 52.4862, lng: -1.8904, make: 'BMW', model: '3 Series', year: 2020, color: 'Blue', licensePlate: 'LM20 NOP', lastSeen: 'Birmingham', photo: 'https://placehold.co/400x300.png' },
    { id: '4', lat: 51.4545, lng: -2.5879, make: 'Audi', model: 'A3', year: 2018, color: 'Black', licensePlate: 'QR18 STU', lastSeen: 'Bristol', photo: 'https://placehold.co/400x300.png' },
    { id: '5', lat: 53.4084, lng: -2.9916, make: 'Mercedes-Benz', model: 'A-Class', year: 2022, color: 'White', licensePlate: 'VW22 XYZ', lastSeen: 'Liverpool', photo: 'https://placehold.co/400x300.png' },
    { id: '6', lat: 53.3811, lng: -1.4701, make: 'Nissan', model: 'Qashqai', year: 2017, color: 'Silver', licensePlate: 'CD17 EFG', lastSeen: 'Sheffield', photo: 'https://placehold.co/400x300.png' },
    { id: '7', lat: 55.9533, lng: -3.1883, make: 'Volkswagen', model: 'Golf', year: 2019, color: 'Grey', licensePlate: 'HI19 JKL', lastSeen: 'Edinburgh', photo: 'https://placehold.co/400x300.png' },
    { id: '8', lat: 51.7520, lng: -1.2577, make: 'Toyota', model: 'Yaris', year: 2020, color: 'Red', licensePlate: 'MN20 OPQ', lastSeen: 'Oxford', photo: 'https://placehold.co/400x300.png' },
  ];

  return (
    <div className="h-[calc(100vh-4rem)]">
        <VehicleMap vehicles={stolenVehicles} />
    </div>
  )
}
