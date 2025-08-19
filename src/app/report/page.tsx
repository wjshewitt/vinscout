import { VehicleReportForm } from '@/components/vehicle-report-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportVehiclePage() {
  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Report a Stolen Vehicle</CardTitle>
          <CardDescription>
            Please provide as much detail as possible. Your report will help the community locate your vehicle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleReportForm />
        </CardContent>
      </Card>
    </div>
  );
}
