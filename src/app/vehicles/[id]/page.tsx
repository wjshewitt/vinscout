import { getVehicleReportById } from '@/lib/firebase';
import { VehicleDetailClient } from '@/components/vehicle-detail-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const vehicle = await getVehicleReportById(params.id);

  if (!vehicle) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The vehicle you are looking for does not exist.</p>
            <Button asChild variant="link">
              <Link href="/">Go back to homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <VehicleDetailClient vehicle={vehicle} />;
}
