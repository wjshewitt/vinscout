
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, BellRing, Eye, FileText, MessageSquare } from 'lucide-react';

export default function AboutPage() {
  const steps = [
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: '1. Report Your Vehicle',
      description: 'If your vehicle is stolen, file a detailed report with us. Provide photos, license plate, VIN, and any distinctive features. The more detail, the better.',
    },
    {
      icon: <BellRing className="h-8 w-8 text-primary" />,
      title: '2. Alert the Network',
      description: 'Once submitted, your report is instantly shared with our network. We can send alerts to users in the area where your vehicle was last seen.',
    },
    {
      icon: <Eye className="h-8 w-8 text-primary" />,
      title: '3. Community Sighting',
      description: 'Our community members are our eyes on the ground. If someone spots a vehicle matching your report, they can report a sighting directly on the platform, pinpointing the location on a map.',
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      title: '4. Secure Communication',
      description: 'You will be notified of any sightings and can communicate securely with the spotter through our private messaging system to coordinate with law enforcement for recovery.',
    },
  ];

  return (
    <div className="container mx-auto py-12 max-w-4xl">
       <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter mb-4">How AutoFind Works</h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          A simple, community-driven approach to recovering stolen vehicles.
        </p>
      </div>

      <Card className="mb-12">
        <CardContent className="p-10 grid md:grid-cols-2 gap-10">
          {steps.map((step) => (
             <div key={step.title} className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">{step.icon}</div>
                <div>
                    <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive-foreground">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertTitle className="text-xl font-bold text-destructive">Important Safety Disclaimer</AlertTitle>
        <AlertDescription className="mt-2 text-base text-destructive-foreground/90">
          Your safety is our top priority. <span className="font-bold">Never approach a stolen vehicle or individuals you suspect may be involved.</span> Do not attempt to recover a vehicle yourself. If you see a crime being committed, we advise contacting your local law enforcement immediately and letting them handle the situation.
        </AlertDescription>
      </Alert>
    </div>
  );
}
