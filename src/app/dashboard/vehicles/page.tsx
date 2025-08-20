
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getUserVehicleReports, VehicleReport } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function MyVehiclesPage() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<VehicleReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchReports = async () => {
        setLoading(true);
        const userReports = await getUserVehicleReports(user.uid);
        setReports(userReports);
        setLoading(false);
      };
      fetchReports();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date';
    // To avoid timezone issues, we can treat the date as UTC.
    // '2024-05-20T...' becomes a Date object interpreted as UTC.
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC' // Specify UTC to ensure consistency
    });
  };

  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>My Vehicle Reports</CardTitle>
          <CardDescription>
            Manage and view the status of your reported vehicles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-20">
               <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : reports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Date Reported</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.make} {vehicle.model} ({vehicle.year})</TableCell>
                    <TableCell><span className="license-plate">{vehicle.licensePlate}</span></TableCell>
                    <TableCell>{formatDate(vehicle.reportedAt)}</TableCell>
                    <TableCell>
                      <Badge variant={vehicle.status === 'Active' ? 'default' : 'secondary'}>
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="outline" size="sm" asChild>
                         <Link href={`/vehicles/${vehicle.id}`}>View Details</Link>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">You have not reported any stolen vehicles.</p>
              <Button asChild className="mt-4">
                <Link href="/report">Report a Vehicle Now</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
