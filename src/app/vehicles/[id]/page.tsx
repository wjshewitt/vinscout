import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

// This would fetch data in a real app
const getVehicleData = (id: string) => {
  return {
    id: '1',
    make: 'Honda',
    model: 'Civic',
    year: 2022,
    color: 'Black',
    licensePlate: '8ABC123',
    vin: '1HGFB2...901234',
    reportedAt: new Date().toISOString(),
    lastSeen: 'Near Downtown Los Angeles',
    details: 'Has a small dent on the rear bumper and a sticker on the back window.',
    photos: [
      'https://placehold.co/800x600',
      'https://placehold.co/400x300',
      'https://placehold.co/400x300',
    ],
    owner: {
      name: 'John D.',
    },
  };
};

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const vehicle = getVehicleData(params.id);
  const isLoggedIn = true; // This would be dynamic

  return (
    <div className="container mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{vehicle.make} {vehicle.model} ({vehicle.year})</CardTitle>
          <CardDescription>Reported Stolen on {new Date(vehicle.reportedAt).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="aspect-video w-full mb-4">
                 <Image
                    src={vehicle.photos[0]}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    width={800}
                    height={600}
                    className="rounded-lg object-cover w-full h-full"
                    data-ai-hint="car side"
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {vehicle.photos.slice(1, 3).map((photo, index) => (
                  <Image
                    key={index}
                    src={photo}
                    alt={`${vehicle.make} ${vehicle.model} photo ${index + 2}`}
                    width={400}
                    height={300}
                    className="rounded-lg object-cover"
                    data-ai-hint="car detail"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span>Make:</span> <span className="text-muted-foreground">{vehicle.make}</span>
                  <span>Model:</span> <span className="text-muted-foreground">{vehicle.model}</span>
                  <span>Year:</span> <span className="text-muted-foreground">{vehicle.year}</span>
                  <span>Color:</span> <span className="text-muted-foreground">{vehicle.color}</span>
                  <span>License Plate:</span> <span className="font-mono text-muted-foreground">{vehicle.licensePlate}</span>
                  <span>VIN:</span> <span className="font-mono text-muted-foreground">{vehicle.vin}</span>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Last Known Information</h3>
                <p className="text-sm"><strong>Location:</strong> {vehicle.lastSeen}</p>
                <p className="text-sm mt-2"><strong>Details:</strong> {vehicle.details}</p>
              </div>
              <Separator />
              <div>
                {isLoggedIn ? (
                  <Button size="lg" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" /> Message Owner ({vehicle.owner.name})
                  </Button>
                ) : (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Have information? <Link href="/login" className="font-bold text-primary underline">Log in</Link> to contact the owner.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
