
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, AlertTriangle, Loader2, Car, CheckCircle, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useMemo } from 'react';
import { getVehicleReports, VehicleReport, LocationInfo } from '@/lib/firebase';
import { useDebounce } from 'use-debounce';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<VehicleReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      const fetchedReports = await getVehicleReports();
      setReports(fetchedReports);
      setLoading(false);
    };
    fetchReports();
  }, []);

  const isLoggedIn = !!user;

  const filteredReports = useMemo(() => {
    if (!debouncedSearchQuery) {
      return reports;
    }
    const lowercasedQuery = debouncedSearchQuery.toLowerCase();
    return reports.filter(report =>
      report.make.toLowerCase().includes(lowercasedQuery) ||
      report.model.toLowerCase().includes(lowercasedQuery) ||
      (report.location?.city && report.location.city.toLowerCase().includes(lowercasedQuery)) ||
      (report.location?.street && report.location.street.toLowerCase().includes(lowercasedQuery)) ||
      report.licensePlate.toLowerCase().replace(/\s/g, '').includes(lowercasedQuery.replace(/\s/g, ''))
    );
  }, [reports, debouncedSearchQuery]);

  const recentVehicles = useMemo(() => filteredReports.slice(0, 3), [filteredReports]);
  
  const stats = useMemo(() => {
    if (loading) return { active: 0, recovered: 0, sightings: 0 };
    const active = reports.filter(r => r.status === 'Active').length;
    const recovered = reports.filter(r => r.status === 'Recovered').length;
    const sightings = reports.reduce((acc, r) => acc + (r.sightingsCount || 0), 0);
    return { active, recovered, sightings };
  }, [reports, loading]);
    
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date';
    const safeDateString = dateString.includes('T') ? dateString : `${dateString}T00:00:00.000Z`;
    const date = new Date(safeDateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };
  
  const formatLocation = (location: LocationInfo, loggedIn: boolean): string => {
    if (!location) return 'Unknown Location';
    
    if (loggedIn) {
        return `${location.street}, ${location.city}`;
    }
    
    return location.city;
  };

  return (
    <div className="container mx-auto py-12">

      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tighter mb-4">Help Recover Stolen Vehicles</h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Our community is our greatest asset. Browse recent reports and keep an eye out. Your vigilance can make all the difference.
        </p>
      </div>

       <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <Card>
          <CardContent className="p-6">
            <Car className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-3xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : stats.active}</p>
            <p className="text-sm text-muted-foreground">Active Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-3xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : stats.recovered}</p>
            <p className="text-sm text-muted-foreground">Vehicles Recovered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Eye className="h-8 w-8 mx-auto text-blue-400 mb-2" />
            <p className="text-3xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : stats.sightings}</p>
            <p className="text-sm text-muted-foreground">Community Sightings</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Most Recent Reports</h2>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : recentVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentVehicles.map(vehicle => (
              <Card key={vehicle.id} className="overflow-hidden hover:border-primary transition-colors">
                 <Link href={`/vehicles/${vehicle.id}`}>
                  <div className="aspect-video w-full">
                    <Image src={vehicle.photos?.[0] || "https://placehold.co/600x400.png"} alt={`${vehicle.make} ${vehicle.model}`} width={600} height={400} className="object-cover w-full h-full" data-ai-hint="car front" />
                  </div>
                  <CardHeader>
                    <CardTitle>{vehicle.make} {vehicle.model}</CardTitle>
                    <CardDescription>{vehicle.year} - Last seen in {formatLocation(vehicle.location, isLoggedIn)}</CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">No vehicles reported yet.</div>
        )}
      </div>

      {!authLoading && !isLoggedIn && (
        <Card className="mb-12 bg-primary/10 border-primary/20">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-bold text-lg">Join the Effort</h3>
                <p className="text-muted-foreground">Sign up to report a stolen vehicle or notify an owner of a sighting.</p>
              </div>
            </div>
             <Button asChild>
                <Link href="/signup">Sign Up Now</Link>
              </Button>
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
            <Input 
              placeholder="Search by Make, Model, License Plate, or Location..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
           {loading ? (
             <div className="flex justify-center items-center py-20">
               <Loader2 className="animate-spin text-primary" size={32} />
             </div>
           ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Vehicle</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Last Seen Location</TableHead>
                  <TableHead>Date Stolen</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 rounded-md">
                            <AvatarImage src={vehicle.photos?.[0] || 'https://placehold.co/40x40.png'} alt={vehicle.make} data-ai-hint="car front" />
                            <AvatarFallback className="rounded-md">{vehicle.make.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                            <div className="text-sm text-muted-foreground">{vehicle.year}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><span className="license-plate">{vehicle.licensePlate}</span></TableCell>
                      <TableCell>{formatLocation(vehicle.location, isLoggedIn)}</TableCell>
                      <TableCell>{formatDate(vehicle.date)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/vehicles/${vehicle.id}`}>View Details</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                            No vehicle reports found matching your search.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
           )}
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
