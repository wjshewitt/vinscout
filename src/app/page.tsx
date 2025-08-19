
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const { user, loading } = useAuth();
  const isLoggedIn = !!user;

  const stolenVehicles = [
    { id: '1', make: 'Lamborghini', model: 'Huracan', year: 2022, lastSeen: 'Los Angeles, CA', dateStolen: '2024-03-15', photo: 'https://placehold.co/40x40.png' },
    { id: '2', make: 'Ferrari', model: 'F8 Tributo', year: 2021, lastSeen: 'New York, NY', dateStolen: '2024-03-10', photo: 'https://placehold.co/40x40.png' },
    { id: '3', make: 'Porsche', model: '911 GT3', year: 1999, lastSeen: 'Chicago, IL', dateStolen: '2024-03-05', photo: 'https://placehold.co/40x40.png' },
    { id: '4', make: 'Ford', model: 'Mustang GT', year: 1968, lastSeen: 'Miami, FL', dateStolen: '2024-03-02', photo: 'https://placehold.co/40x40.png' },
  ];

  const recentVehicles = [...stolenVehicles]
    .sort((a, b) => new Date(b.dateStolen).getTime() - new Date(a.dateStolen).getTime())
    .slice(0, 3);
    
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-12">

      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tighter mb-4">Help Recover Stolen Vehicles</h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Our community is our greatest asset. Browse recent reports and keep an eye out. Your vigilance can make all the difference.
        </p>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Most Recent Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentVehicles.map(vehicle => (
            <Card key={vehicle.id} className="overflow-hidden hover:border-primary transition-colors">
               <Link href={`/vehicles/${vehicle.id}`}>
                <div className="aspect-video w-full">
                  <Image src="https://placehold.co/600x400.png" alt={`${vehicle.make} ${vehicle.model}`} width={600} height={400} className="object-cover w-full h-full" data-ai-hint="car front" />
                </div>
                <CardHeader>
                  <CardTitle>{vehicle.make} {vehicle.model}</CardTitle>
                  <CardDescription>{vehicle.year} - Last seen in {vehicle.lastSeen}</CardDescription>
                </CardHeader>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {!loading && !isLoggedIn && (
        <Card className="mb-12 bg-blue-900/20 border-blue-500/30">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-bold text-lg">Join the Effort</h3>
                <p className="text-muted-foreground">Sign up to report a stolen vehicle or notify an owner of a sighting.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">All Vehicle Reports</h1>
          <p className="text-muted-foreground">Browse all community reports. Your vigilance can help recover these vehicles.</p>
        </div>
        <Button asChild>
            <Link href="/report">Report a Vehicle</Link>
        </Button>
      </div>


      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search by Make, Model, Location..." className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Vehicle</TableHead>
                <TableHead>Last Seen Location</TableHead>
                <TableHead>Date Stolen</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stolenVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 rounded-md">
                        <AvatarImage src={vehicle.photo} alt={vehicle.make} data-ai-hint="car front" />
                        <AvatarFallback className="rounded-md">{vehicle.make.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                        <div className="text-sm text-muted-foreground">{vehicle.year}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{vehicle.lastSeen}</TableCell>
                  <TableCell>{formatDate(vehicle.dateStolen)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/vehicles/${vehicle.id}`}>View Details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

    </div>
  );
}
