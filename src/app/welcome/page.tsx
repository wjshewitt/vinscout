
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PartyPopper } from 'lucide-react';

export default function WelcomePage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="mx-auto max-w-lg w-full text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/20 p-4 rounded-full w-fit mb-4">
            <PartyPopper className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">Welcome to AutoFind!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            We're thrilled to have you on board.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            You are now part of a community dedicated to recovering stolen vehicles. You can now report a vehicle, browse active cases, and help others.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard">Go to my Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
