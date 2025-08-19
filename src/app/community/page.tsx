import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CommunityPage() {
  return (
    <div className="container mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Community Hub</CardTitle>
          <CardDescription>
            Connect with other users and share information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Community features are coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
