import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MessagesPage() {
  return (
    <div className="container mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Secure Messages</CardTitle>
          <CardDescription>
            Communicate securely about potential sightings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Messaging feature coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
