
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageSquare, Bell, Car, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { listenToUnreadCount, getUserVehicleReports } from '@/lib/firebase';

export default function DashboardPage() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);

      const unsubscribeUnread = listenToUnreadCount(user.uid, (count) => {
        setUnreadCount(count);
      });

      const fetchReports = async () => {
        const userReports = await getUserVehicleReports(user.uid);
        setReportCount(userReports.length);
        setLoading(false);
      };

      fetchReports();

      return () => {
        unsubscribeUnread();
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const getMessageText = () => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (unreadCount === 0) {
      return 'You have no unread messages.';
    }
    if (unreadCount === 1) {
      return 'You have 1 unread message.';
    }
    return `You have ${unreadCount} unread messages.`;
  };
  
  const getReportText = () => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (reportCount === 0) {
      return 'You have no active reports.';
    }
    if (reportCount === 1) {
      return 'You have 1 active report.';
    }
    return `You have ${reportCount} active reports.`;
  }

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
            <p className="flex items-center gap-2">{getReportText()}</p>
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
             <p className="flex items-center gap-2">{getMessageText()}</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/messages">View Messages</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="text-primary"/> Settings</CardTitle>
            <CardDescription>Configure your notifications and account.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Manage your alert and account preferences.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/settings">Manage Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
