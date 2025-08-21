
import { getUserProfile, getUserVehicleReports, getUserSightings, VehicleReport, Sighting, UserProfile as UserProfileData } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, Eye, Calendar } from 'lucide-react';
import Image from 'next/image';

function ProfileHeader({ profile }: { profile: UserProfileData }) {
  return (
    <Card>
      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
        <Avatar className="w-24 h-24 border-4 border-primary/20">
          <AvatarImage src={profile.photoURL} alt={profile.displayName} data-ai-hint="person face" />
          <AvatarFallback className="text-4xl">{profile.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{profile.displayName}</h1>
          <p className="text-muted-foreground">Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function UserReports({ reports }: { reports: VehicleReport[] }) {
  if (reports.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">This user has not reported any vehicles.</div>
  }
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {reports.map(report => (
        <Card key={report.id}>
          <CardContent className="p-4 flex gap-4">
            <div className="w-24 h-24 relative bg-muted rounded-md flex-shrink-0">
               {report.photos && report.photos.length > 0 ? (
                <Image src={report.photos[0]} alt={`${report.make} ${report.model}`} layout="fill" objectFit="cover" className="rounded-md" />
              ) : (
                <Car className="h-12 w-12 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{report.make} {report.model} ({report.year})</h3>
              <p className="text-sm text-muted-foreground">Reported on {formatDate(report.reportedAt)}</p>
              <Button asChild size="sm" className="mt-2">
                <Link href={`/vehicles/${report.id}`}>View Report</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function UserSightings({ sightings }: { sightings: Sighting[] }) {
  if (sightings.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">This user has not reported any sightings.</div>
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="space-y-4">
      {sightings.map(sighting => (
        <Card key={sighting.id}>
          <CardContent className="p-4 flex gap-4">
             <div className="w-24 h-24 relative bg-muted rounded-md flex-shrink-0">
                {sighting.vehicle?.photos && sighting.vehicle.photos.length > 0 ? (
                    <Image src={sighting.vehicle.photos[0]} alt={`${sighting.vehicle.make} ${sighting.vehicle.model}`} layout="fill" objectFit="cover" className="rounded-md" />
                ) : (
                    <Car className="h-12 w-12 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Sighting reported for a <Link href={`/vehicles/${sighting.vehicleId}`} className="font-semibold text-primary hover:underline">{sighting.vehicle?.make} {sighting.vehicle?.model}</Link></p>
              <p className="text-sm mt-1">"{sighting.message}"</p>
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> <span>{formatDateTime(sighting.sightedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


export default async function ProfilePage({ params }: { params: { id: string } }) {
  
  const profile = await getUserProfile(params.id);
  
  if (!profile) {
    notFound();
  }

  const [reports, sightings] = await Promise.all([
    getUserVehicleReports(params.id),
    getUserSightings(params.id)
  ]);

  return (
    <div className="container mx-auto py-12 max-w-4xl space-y-8">
      <ProfileHeader profile={profile} />

       <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reports"><Car className="mr-2" />Vehicle Reports ({reports.length})</TabsTrigger>
              <TabsTrigger value="sightings"><Eye className="mr-2"/>Sightings ({sightings.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="reports" className="pt-6">
              <UserReports reports={reports} />
          </TabsContent>
          <TabsContent value="sightings" className="pt-6">
              <UserSightings sightings={sightings} />
          </TabsContent>
      </Tabs>
    </div>
  );
}
