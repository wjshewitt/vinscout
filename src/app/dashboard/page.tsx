import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageSquare, Bell, Car } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Car className="text-primary"/> My Vehicles</CardTitle>
            <CardDescription>Manage your reported vehicles.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>You have 1 active report.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/vehicles">View Reports</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="text-primary"/> Messages</CardTitle>
            <CardDescription>View your secure messages.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>You have 3 unread messages.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/messages">View Messages</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="text-primary"/> Notifications</CardTitle>
            <CardDescription>Configure your alert settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Local notifications are enabled.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/notifications">Manage Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
