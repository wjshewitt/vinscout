import { VehicleReportForm } from '@/components/vehicle-report-form';

export default function ReportVehiclePage() {
  return (
    <main className="flex-1 bg-gradient-to-b from-background to-gray-900">
      <div className="container mx-auto max-w-4xl py-16 px-4">
        <div className="space-y-4 text-center">
          <h1 className="text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">
            Report a Stolen Vehicle
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your eyes on the road are crucial. Provide details about the stolen vehicle to mobilize our network and help bring it home.
          </p>
        </div>
        <div className="mt-12 bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl shadow-blue-500/10">
          <VehicleReportForm />
        </div>
      </div>
    </main>
  );
}
