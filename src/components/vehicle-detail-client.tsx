
'use client';

import Image from "next/legacy/image";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2, Eye, HelpCircle, CheckCircle, MapPin, User, Calendar, Trash2, PoundSterling, ShieldCheck, Pencil, Car, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { VehicleReport, Sighting, Message, LocationInfo, createOrGetConversation, sendMessage, getVehicleSightings, submitSighting, deleteVehicleReport, updateVehicleStatus, updateVehicleReport } from '@/lib/firebase';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useDebouncedCallback } from 'use-debounce';
import VehicleSightingsMap from './vehicle-sightings-map';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

const formatDateUTC = (dateString: string, options: Intl.DateTimeFormatOptions) => {
    if (!dateString) return 'N/A';
    const safeDateString = dateString.includes('T') ? dateString : `${dateString}T00:00:00.000Z`;
    const date = new Date(safeDateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });
};


const parseAddressComponentsSighting = (components: google.maps.GeocoderAddressComponent[]): Partial<LocationInfo> => {
    const parsed: Partial<LocationInfo> = {};
    for (const component of components) {
        if (component.types.includes('route')) {
            parsed.street = component.long_name;
        }
        if(component.types.includes('street_number') && parsed.street) {
            parsed.street = `${component.long_name} ${parsed.street}`;
        }
        if (component.types.includes('locality') || component.types.includes('postal_town')) {
            parsed.city = component.long_name;
        }
        if (component.types.includes('postal_code')) {
            parsed.postcode = component.long_name;
        }
        if (component.types.includes('country')) {
            parsed.country = component.long_name;
        }
    }
    return parsed;
};

function SightingLocationPicker({ onLocationChange }: { onLocationChange: (pos: { lat: number; lng: number; locationInfo: LocationInfo }) => void }) {
    const { toast } = useToast();
    const map = useMap();
    const [searchAddress, setSearchAddress] = useState('');
    const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral>({ lat: 51.5072, lng: -0.1276 });

    const geocodeLocation = (location: google.maps.LatLngLiteral | string) => {
        const geocoder = new google.maps.Geocoder();
        const request = typeof location === 'string' ? { address: location } : { location };
        
        geocoder.geocode(request, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const result = results[0];
                const newPos = { lat: result.geometry.location.lat(), lng: result.geometry.location.lng() };
                const locationInfo = {
                    ...parseAddressComponentsSighting(result.address_components),
                    fullAddress: result.formatted_address,
                } as LocationInfo;

                setMarkerPos(newPos);
                if (map) map.panTo(newPos);
                if (typeof location !== 'string') setSearchAddress(result.formatted_address);

                onLocationChange({ ...newPos, locationInfo });
            } else {
                 toast({
                     variant: 'destructive',
                     title: 'Geocoding Failed',
                     description: `Could not find a location. Please be more specific.`,
                 });
            }
        });
    };
    
    const debouncedGeocodeAddress = useDebouncedCallback((address: string) => {
        if (address) {
            geocodeLocation(address);
        }
    }, 1000);

    const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setMarkerPos(newPos);
            geocodeLocation(newPos);
        }
    };
    
    return (
         <div className="space-y-4">
             <Input 
                placeholder="Search for location"
                value={searchAddress}
                onChange={(e) => {
                    setSearchAddress(e.target.value);
                    debouncedGeocodeAddress(e.target.value);
                }}
            />
            <div className="h-64 w-full rounded-lg overflow-hidden border">
                 <Map
                    defaultCenter={markerPos}
                    defaultZoom={12}
                    mapId="sighting_form_map"
                    gestureHandling="greedy"
                    disableDefaultUI={true}
                >
                    <AdvancedMarker position={markerPos} draggable={true} onDragEnd={handleMarkerDragEnd}>
                        <MapPin size={32} className="text-primary" />
                    </AdvancedMarker>
                </Map>
            </div>
             <p className="text-xs text-muted-foreground">Search for the sighting location or drag the pin.</p>
         </div>
    )
}

const editReportSchema = z.object({
  colour: z.string().min(2, 'Colour is required'),
  vin: z.string().optional(),
  features: z.string().optional(),
  rewardAmount: z.coerce.number().optional(),
  rewardDetails: z.string().optional(),
});

type EditReportFormValues = z.infer<typeof editReportSchema>;

function EditReportDialog({ vehicle, onUpdate }: { vehicle: VehicleReport, onUpdate: (data: Partial<VehicleReport>) => void }) {
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<EditReportFormValues>({
        resolver: zodResolver(editReportSchema),
        defaultValues: {
            colour: vehicle.colour || '',
            vin: vehicle.vin || '',
            features: vehicle.features || '',
            rewardAmount: vehicle.rewardAmount || 0,
            rewardDetails: vehicle.rewardDetails || '',
        },
    });
    
    async function onSubmit(data: EditReportFormValues) {
        setIsSaving(true);
        try {
            await updateVehicleReport(vehicle.id, data);
            onUpdate(data);
            toast({ title: 'Report Updated', description: 'Your vehicle details have been saved.' });
            setIsOpen(false);
        } catch (error) {
            console.error('Error updating report', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update report.' });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Pencil className="mr-2 h-4 w-4" />Edit Report</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Vehicle Report</DialogTitle>
                    <DialogDescription>
                        Update the details of your report. Core details like make, model, and license plate cannot be changed.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField
                                control={form.control}
                                name="colour"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Colour</FormLabel>
                                    <FormControl>
                                    <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="vin"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>VIN (Optional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                        <FormField
                            control={form.control}
                            name="features"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Distinctive Features (Optional)</FormLabel>
                                <FormControl>
                                <Textarea
                                    placeholder="e.g., Carbon fiber roof, aftermarket wheels, small dent on rear bumper"
                                    className="resize-none"
                                    {...field}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <Separator />
                        <div className="space-y-4">
                            <h4 className="font-medium">Reward Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="rewardAmount"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reward Amount (£) (Optional)</FormLabel>
                                        <div className="relative">
                                            <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <FormControl>
                                                <Input type="number" {...field} className="pl-10" />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="rewardDetails"
                                    render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Reward Details (Optional)</FormLabel>
                                        <FormControl>
                                        <Textarea
                                            placeholder="e.g., Reward for information leading to recovery..."
                                            className="resize-none"
                                            {...field}
                                        />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                         <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export function VehicleDetailClient({ vehicle: initialVehicle }: { vehicle: VehicleReport }) {
  const { user, loading: authLoading } = useAuth();
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [messageType, setMessageType] = useState<Message['messageType']>();
  const { toast } = useToast();
  const router = useRouter();
  const isLoggedIn = !!user;
  const isOwner = isLoggedIn && vehicle.reporterId === user.uid;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [sightingLocation, setSightingLocation] = useState<{lat: number, lng: number, locationInfo: LocationInfo} | null>(null);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loadingSightings, setLoadingSightings] = useState(true);

  useEffect(() => {
    setVehicle(initialVehicle);
  }, [initialVehicle]);
  
  useEffect(() => {
    if (vehicle.id) {
        setLoadingSightings(true);
        getVehicleSightings(vehicle.id)
            .then(setSightings)
            .finally(() => setLoadingSightings(false));
    }
  }, [vehicle.id]);

  const handleLocationChange = useCallback((loc: { lat: number; lng: number; locationInfo: LocationInfo }) => {
    setSightingLocation(loc);
  }, []);
  
  const handleReportUpdate = useCallback((updatedData: Partial<VehicleReport>) => {
    setVehicle(prev => ({...prev, ...updatedData}))
  }, []);

  const formatDateTime = (dateString: string) => {
     return formatDateUTC(dateString, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  
   const formatDate = (dateString: string) => {
     return formatDateUTC(dateString, { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const handleSendMessage = async () => {
    if (!user || !message.trim() || !messageType) return;
   
    setIsSending(true);
    try {
        const conversationId = await createOrGetConversation(vehicle, user);
        
        let finalSightingLocation: Message['sightingLocation'] | undefined = undefined;

        if (messageType === 'Sighting') {
            if (!sightingLocation) {
                 toast({ variant: "destructive", title: "Location Missing", description: "Please pin the location of the sighting on the map." });
                 setIsSending(false);
                 return;
            }
            await submitSighting(vehicle.id, user, { 
                message, 
                location: sightingLocation.locationInfo, 
                lat: sightingLocation.lat, 
                lng: sightingLocation.lng 
            });
            finalSightingLocation = {
                lat: sightingLocation.lat,
                lng: sightingLocation.lng,
                address: sightingLocation.locationInfo.fullAddress
            };
            // Refetch sightings to update the page
            setSightings(await getVehicleSightings(vehicle.id));
        }

        await sendMessage(conversationId, message, user, messageType, finalSightingLocation);
        
        toast({
            title: "Message Sent!",
            description: "Your message has been sent to the vehicle owner.",
        });
        
        setIsDialogOpen(false);
        setMessage('');
        setMessageType(undefined);
        setSightingLocation(null);
        
        // Navigate to the messages page to see the conversation
        router.push(`/dashboard/messages?conversationId=${conversationId}`);
        
    } catch (error) {
        console.error("Failed to send message:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to send message. Please try again.",
        });
    } finally {
        setIsSending(false);
    }
  };
  
   const handleDeleteReport = async () => {
    if (!isOwner) return;
    setIsDeleting(true);
    try {
      await deleteVehicleReport(vehicle.id);
      toast({
        title: 'Report Deleted',
        description: 'Your vehicle report has been permanently deleted.',
      });
      router.push('/dashboard/vehicles');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete report. Please try again.',
      });
      setIsDeleting(false);
    }
  };
  
  const handleStatusUpdate = async (newStatus: 'Active' | 'Recovered') => {
      if (!isOwner) return;
      setIsUpdatingStatus(true);
      try {
        await updateVehicleStatus(vehicle.id, newStatus);
        setVehicle(prev => ({...prev, status: newStatus}));
        toast({
            title: `Status Updated to ${newStatus}`,
            description: `This vehicle report is now marked as ${newStatus}.`,
        });
      } catch (error) {
         console.error('Error updating status:', error);
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update vehicle status. Please try again.',
         });
      } finally {
        setIsUpdatingStatus(false);
      }
  };
  
  const mostRecentSighting = sightings?.[0];
  const hasReward = vehicle.rewardAmount || vehicle.rewardDetails;
  
  const hasPhotos = vehicle.photos && vehicle.photos.length > 0;

  return (
    <div className="container mx-auto py-12 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-4 mb-2">
                 <CardTitle className="text-3xl">{vehicle.make} {vehicle.model} ({vehicle.year})</CardTitle>
                 <Badge variant={vehicle.status === 'Active' ? 'default' : 'secondary'} className={cn(vehicle.status === 'Recovered' && 'bg-green-700 hover:bg-green-700/90')}>
                    {vehicle.status}
                 </Badge>
              </div>
              <CardDescription>Reported Stolen on {formatDate(vehicle.reportedAt)} by <Link href={`/profile/${vehicle.reporterId}`} className="text-primary hover:underline">{isOwner ? 'you' : 'a community member'}</Link></CardDescription>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                <Eye className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg text-foreground">{vehicle.sightingsCount || 0}</span>
                <span>Sightings</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="w-full">
                 <div className="aspect-video w-full relative bg-muted rounded-lg flex items-center justify-center">
                      {hasPhotos ? (
                          <Carousel className="w-full h-full">
                              <CarouselContent>
                                  {vehicle.photos.map((src, index) => (
                                  <CarouselItem key={index}>
                                      <div className="relative w-full h-full aspect-video">
                                          <Image src={src} alt={`Vehicle photo ${index + 1}`} layout="fill" objectFit="cover" className="rounded-lg" />
                                      </div>
                                  </CarouselItem>
                                  ))}
                              </CarouselContent>
                              {vehicle.photos.length > 1 && (
                                <>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                </>
                              )}
                          </Carousel>
                      ) : (
                          <Car className="h-24 w-24 text-muted-foreground" />
                      )}
                 </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Vehicle Details</h3>
                <div className="space-y-2 text-sm">
                    <p><strong>Make:</strong> <span className="text-muted-foreground">{vehicle.make}</span></p>
                    <p><strong>Model:</strong> <span className="text-muted-foreground">{vehicle.model}</span></p>
                    <p><strong>Year:</strong> <span className="text-muted-foreground">{vehicle.year}</span></p>
                    <p><strong>Colour:</strong> <span className="text-muted-foreground">{vehicle.colour}</span></p>
                    <p><strong>License Plate:</strong> <span className="font-mono">{vehicle.licensePlate}</span></p>
                    {vehicle.vin && <p><strong>VIN:</strong> <span className="font-mono text-muted-foreground">{vehicle.vin}</span></p>}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Last Known Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Date of Theft:</strong> {formatDate(vehicle.date)}</p>
                  <p><strong>Original Location:</strong> {vehicle.location.fullAddress}</p>
                  {mostRecentSighting && (
                      <p className="text-primary"><strong>Last Sighting:</strong> {mostRecentSighting.location.fullAddress}</p>
                  )}
                  <p className="mt-2"><strong>Details:</strong> {vehicle.features || 'No additional details provided.'}</p>
                  <div className={cn(
                    "flex items-center gap-2 mt-2 p-2 rounded-md",
                    vehicle.reportedToPolice ? 'bg-green-500/10' : 'bg-amber-500/10'
                  )}>
                    {vehicle.reportedToPolice 
                      ? <CheckCircle className="h-4 w-4 text-green-500" />
                      : <AlertTriangle className="h-4 w-4 text-amber-500" />
                    }
                    <span className={cn("text-xs font-medium", vehicle.reportedToPolice ? 'text-green-400' : 'text-amber-400')}>
                      {vehicle.reportedToPolice ? 'Theft has been reported to the police.' : 'Theft has not yet been reported to the police.'}
                    </span>
                  </div>
                </div>
              </div>
                 {hasReward && (
                     <>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                               Reward Offered
                            </h3>
                             {vehicle.rewardAmount && vehicle.rewardAmount > 0 && (
                                <p className="text-2xl font-bold text-primary">£{vehicle.rewardAmount.toLocaleString()}</p>
                            )}
                            {vehicle.rewardDetails && <p className="text-sm text-muted-foreground mt-1">{vehicle.rewardDetails}</p>}
                             {!isLoggedIn && (
                                <p className="text-xs text-muted-foreground mt-2">You must be logged in to contact the owner about a reward.</p>
                             )}
                        </div>
                     </>
                   )}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 mt-6">
            <div className="space-y-6">

            </div>
            <div className="space-y-6">
                {authLoading ? (
                  <Loader2 className="animate-spin text-primary" />
                ) : !isOwner && vehicle.status === 'Active' && (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4" /> Message Owner
                      </Button>
                    </DialogTrigger>
                    {isLoggedIn ? (
                        <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Contact the owner</DialogTitle>
                            <DialogDescription>
                            Provide any information that could help locate the vehicle. Your message will be sent securely.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid w-full gap-1.5">
                            <Label htmlFor="message-type">Reason for contact</Label>
                            <Select onValueChange={(value) => setMessageType(value as Message['messageType'])} value={messageType}>
                                <SelectTrigger id="message-type">
                                    <SelectValue placeholder="Select a reason..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sighting">
                                        <div className="flex items-center gap-2"><Eye className="h-4 w-4"/> I have seen this vehicle</div>
                                    </SelectItem>
                                    <SelectItem value="Vehicle Found">
                                        <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4"/> I have found this vehicle</div>
                                    </SelectItem>
                                    <SelectItem value="Question">
                                        <div className="flex items-center gap-2"><HelpCircle className="h-4 w-4"/> I have a question</div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            </div>
                            
                            {messageType === 'Sighting' && apiKey && (
                                <div className="space-y-2">
                                    <Label>Sighting Location</Label>
                                    <APIProvider apiKey={apiKey}>
                                        <SightingLocationPicker onLocationChange={handleLocationChange} />
                                    </APIProvider>
                                </div>
                            )}
                            
                            <div className="grid w-full gap-1.5">
                            <Label htmlFor="message">Your message</Label>
                            <Textarea placeholder="Type your message here." id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleSendMessage} disabled={isSending || !message.trim() || !messageType}>
                                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Send Message
                            </Button>
                        </DialogFooter>
                        </DialogContent>
                    ) : (
                        <DialogContent>
                             <DialogHeader>
                                <DialogTitle>Login Required</DialogTitle>
                                <DialogDescription>
                                    You need to be logged in to contact a vehicle owner.
                                </DialogDescription>
                            </DialogHeader>
                             <DialogFooter>
                                <Button asChild><Link href="/login">Log In</Link></Button>
                             </DialogFooter>
                        </DialogContent>
                    )}
                  </Dialog>
                )}
            </div>
          </div>
        </CardContent>
        {isOwner && (
            <CardFooter className="border-t bg-muted/30 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <p className="text-sm text-muted-foreground text-center sm:text-left">This is your report. You can manage its status here or delete it permanently.</p>
                 <div className="flex items-center gap-2">
                    <EditReportDialog vehicle={vehicle} onUpdate={handleReportUpdate} />
                    {vehicle.status === 'Active' ? (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:text-green-300">
                                    <ShieldCheck className="mr-2 h-4 w-4"/>Mark as Recovered
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Mark as Recovered?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will update the report's status to "Recovered" and remove it from the active list. You can reverse this action later.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleStatusUpdate('Recovered')} disabled={isUpdatingStatus}>
                                        {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Confirm
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button>Re-list as Active</Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Re-list as Active?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will change the status back to "Active" and make it visible on the main list again.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleStatusUpdate('Active')} disabled={isUpdatingStatus}>
                                        {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Re-list
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Report
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your vehicle report and all associated sightings and messages.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteReport} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Yes, delete it
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                 </div>
            </CardFooter>
        )}
      </Card>
      
      {apiKey && (vehicle.lat || sightings.length > 0) && (
        <Card>
            <CardHeader>
                <CardTitle>Sighting Map</CardTitle>
                <CardDescription>
                    {mostRecentSighting 
                        ? `This car was stolen from ${vehicle.location.fullAddress}. It has been most recently sighted near ${mostRecentSighting.location.fullAddress}.`
                        : `This map shows the original location where the vehicle was reported stolen.`
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-96 w-full rounded-lg overflow-hidden border">
                    <APIProvider apiKey={apiKey}>
                        <VehicleSightingsMap originalReport={vehicle} sightings={sightings} />
                    </APIProvider>
                </div>
            </CardContent>
        </Card>
      )}

      {sightings.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>Community Sightings</CardTitle>
                <CardDescription>All reported sightings for this vehicle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loadingSightings ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                    sightings.map(sighting => (
                        <div key={sighting.id} className="p-4 rounded-lg border bg-card flex flex-col sm:flex-row gap-4">
                           <div className="flex-shrink-0">
                             <Link href={`/profile/${sighting.sighterId}`}>
                                 <Avatar>
                                    <AvatarImage src={sighting.sighterAvatar} alt={sighting.sighterName} data-ai-hint="person face" />
                                    <AvatarFallback>{sighting.sighterName?.charAt(0) || 'U'}</AvatarFallback>
                                 </Avatar>
                             </Link>
                           </div>
                           <div className="flex-1">
                                <p className="text-sm text-muted-foreground">{sighting.message}</p>
                                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                    <p className="flex items-center gap-2"><User size={14} /> Reported by <Link href={`/profile/${sighting.sighterId}`} className="hover:underline text-primary/80 hover:text-primary">{sighting.sighterName}</Link></p>
                                    <p className="flex items-center gap-2"><MapPin size={14} /> Sighted at {sighting.location.fullAddress}</p>
                                    <p className="flex items-center gap-2"><Calendar size={14} /> On {formatDateTime(sighting.sightedAt)}</p>
                                </div>
                           </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}



    