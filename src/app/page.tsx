import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Home() {
  const stolenVehicles = [
    { id: '1', make: 'Lamborghini', model: 'Huracan', year: 2022, lastSeen: 'Los Angeles, CA', dateStolen: 'March 15, 2024', photo: 'https://placehold.co/40x40.png' },
    { id: '2', make: 'Ferrari', model: 'F8 Tributo', year: 2021, lastSeen: 'New York, NY', dateStolen: 'March 10, 2024', photo: 'https://placehold.co/40x40.png' },
    { id: '3', make: 'Porsche', model: '911 GT3', year: 1999, lastSeen: 'Chicago, IL', dateStolen: 'March 5, 2024', photo: 'https://placehold.co/40x40.png' },
    { id: '4', make: 'Ford', model: 'Mustang GT', year: 1968, lastSeen: 'Miami, FL', dateStolen: 'March 2, 2024', photo: 'https://placehold.co/40x40.png' },
    { id: '5', make: 'Nissan', model: 'Skyline GT-R', year: 1995, lastSeen: 'San Francisco, CA', dateStolen: 'February 28, 2024', photo: 'https://placehold.co/40x40.png' },
    { id: '6', make: 'Toyota', model: 'Supra', year: 1998, lastSeen: 'London, UK', dateStolen: 'February 25, 2024', photo: 'https://placehold.co/40x40.png' },
    { id: '7', make: 'BMW', model: 'M3', year: 2020, lastSeen: 'Manchester, UK', dateStolen: 'February 20, 2024', photo: 'https://placehold.co/40x40.png' },
  ];

  return (
    <div className="container mx-auto py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Stolen Vehicle Reports</h1>
        <p className="text-muted-foreground">Browse community reports. Your vigilance can help recover these vehicles.</p>
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
                  <TableCell>{vehicle.dateStolen}</TableCell>
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
            <PaginationLink href="#" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
           <PaginationItem>
            <span className="px-4">...</span>
          </PaginationItem>
           <PaginationItem>
            <PaginationLink href="#">10</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

    </div>
  );
}
