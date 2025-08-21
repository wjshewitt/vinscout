
import { VehicleReportForm } from '@/components/vehicle-report-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportVehiclePage() {
  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Report a Stolen Vehicle</CardTitle>
          <CardDescription>
            Please provide as much detail as possible. All information will be made public to help the community identify your vehicle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleReportForm />
        </CardContent>
      </Card>
    </div>
  );
}
