
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PartyPopper, BellPlus } from 'lucide-react';

export default function WelcomePage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="mx-auto max-w-lg w-full text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/20 p-4 rounded-full w-fit mb-4">
            <PartyPopper className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">Welcome to Vinscout!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            You're all set up and ready to go.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-8">
            To get the most out of the community, we highly recommend setting up your notification preferences. This will allow you to receive alerts for stolen vehicles in your area.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">Go to my Dashboard</Link>
            </Button>
            <Button asChild size="lg">
                <Link href="/dashboard/settings"><BellPlus className="mr-2"/>Set Up Notifications</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
