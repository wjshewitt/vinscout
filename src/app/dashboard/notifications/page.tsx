
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, MapPin, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useDebouncedCallback } from 'use-debounce';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getUserGeofences, saveUserGeofence, deleteUserGeofence, GeofenceLocation, getNotificationSettings, saveNotificationSettings, UserNotificationSettings } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';


function MapComponent({ onLocationSelect }: { onLocationSelect: (location: { lat: number, lng: number, address: string }) => void }) {
  const map = useMap();
  const { toast } = useToast();
  const [markerPos, setMarkerPos] = useState({ lat: 51.5072, lng: -0.1276 }); // Default to London
  const [searchAddress, setSearchAddress] = useState("");

  const geocodeAddress = useDebouncedCallback((address: string) => {
    if (!address) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            const newPos = { lat: location.lat(), lng: location.lng() };
            setMarkerPos(newPos);
            if (map) {
                map.panTo(newPos);
                map.setZoom(15);
            }
            onLocationSelect({ ...newPos, address: results[0].formatted_address });
        } else {
            toast({
                variant: 'destructive',
                title: 'Geocoding Failed',
                description: `Could not find a location for the address: ${address}.`,
            });
        }
    });
  }, 1000);

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPos(newPos);
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: newPos }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
              onLocationSelect({ ...newPos, address: results[0].formatted_address });
              setSearchAddress(results[0].formatted_address);
          }
      });
    }
  };

  return (
      <div className="relative h-96 overflow-hidden rounded-lg">
          <Map
            defaultCenter={markerPos}
            defaultZoom={12}
            mapId="geofence_map"
            gestureHandling="greedy"
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={false}
          >
              <AdvancedMarker position={markerPos} draggable={true} onDragEnd={handleMarkerDragEnd}>
                  <MapPin size={40} className="text-primary" />
              </AdvancedMarker>
          </Map>

          <div className="absolute top-4 left-4 right-4 z-10">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                      className="w-full rounded-md bg-background/80 py-3 pl-10 pr-4 text-base placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-primary"
                      placeholder="Search for a location or address"
                      value={searchAddress}
                      onChange={(e) => {
                          setSearchAddress(e.target.value);
                          geocodeAddress(e.target.value);
                      }}
                  />
              </div>
          </div>
      </div>
  );
}


function AddLocationDialog({ onSave, onOpenChange }: { onSave: (location: GeofenceLocation) => Promise<void>, onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number, address: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) return null;

  const handleSave = async () => {
    if (name && selectedLocation) {
        setIsSaving(true);
        try {
            await onSave({ name, ...selectedLocation });
            onOpenChange(false); // Close dialog on success
        } catch (error) {
            // Error toast is handled in the parent component
        } finally {
            setIsSaving(false);
        }
    }
  };

  return (
    <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-0">
            <DialogTitle>Add New Geofence</DialogTitle>
            <DialogDescription>
                Search for an address and give it a name. Local alerts will be sent for vehicles reported in this area.
            </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
           <div className="space-y-4">
                <Input 
                    placeholder="Location Name (e.g., Home, Work)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Card className="bg-muted/50">
                   <CardContent className="p-4">
                     <p className="font-semibold text-sm">Selected Address:</p>
                     <p className="text-muted-foreground text-sm">{selectedLocation?.address || 'Search or drag the pin on the map'}</p>
                   </CardContent>
                </Card>
           </div>
           <div>
            <APIProvider apiKey={apiKey}>
                <MapComponent onLocationSelect={setSelectedLocation} />
            </APIProvider>
           </div>
        </div>
        <DialogFooter className="p-6 pt-0">
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={!name || !selectedLocation || isSaving}>
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : null}
                Save Geofence
            </Button>
        </DialogFooter>
    </DialogContent>
  );
}


export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [locations, setLocations] = useState<GeofenceLocation[]>([]);
  const [settings, setSettings] = useState<UserNotificationSettings>({ nationalAlerts: false, localAlerts: true });
  const [loading, setLoading] = useState(true);
  const [isAddLocationDialogOpen, setIsAddLocationDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        getUserGeofences(user.uid),
        getNotificationSettings(user.uid)
      ]).then(([geofences, notificationSettings]) => {
        setLocations(geofences);
        setSettings(notificationSettings);
      }).finally(() => setLoading(false));
    } else if (!authLoading) {
        setLoading(false);
    }
  }, [user, authLoading]);

  const handleSettingsChange = async (changedSettings: Partial<UserNotificationSettings>) => {
    if (!user) return;
    const newSettings = { ...settings, ...changedSettings };
    setSettings(newSettings); // Optimistic update
    try {
        await saveNotificationSettings(user.uid, newSettings);
        toast({
            title: "Settings Saved",
            description: "Your notification preferences have been updated.",
        });
    } catch (error) {
        setSettings(settings); // Revert on error
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings.' });
    }
  };

  const handleSaveLocation = async (location: GeofenceLocation) => {
    if (!user) return;
    try {
        await saveUserGeofence(user.uid, location);
        setLocations(prev => {
            const existing = prev.find(l => l.name === location.name);
            if (existing) {
                return prev.map(l => l.name === location.name ? location : l);
            }
            return [...prev, location];
        });
        toast({
            title: "Location Saved",
            description: `The geofence for "${location.name}" has been saved.`,
        });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save location.' });
        throw error; // Re-throw to be caught in the dialog
    }
  };

  const handleDeleteLocation = async (locationName: string) => {
     if (!user) return;
     try {
        await deleteUserGeofence(user.uid, locationName);
        setLocations(prev => prev.filter(l => l.name !== locationName));
        toast({
            title: "Location Deleted",
            description: `The geofence for "${locationName}" has been removed.`,
        });
     } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete location.' });
     }
  };


  return (
    <div className="container mx-auto py-12 max-w-4xl">
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
            <p className="mt-2 text-muted-foreground">Choose how you want to be notified about stolen vehicle reports.</p>
        </div>
        
        {loading ? (
             <div className="flex justify-center items-center py-20">
               <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        ) : (
            <div className="space-y-12">
                <Card>
                    <CardHeader>
                        <CardTitle>Alert Preferences</CardTitle>
                        <CardDescription>Select the types of alerts you would like to receive.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="national-alerts" className="text-base font-medium">National Alerts</Label>
                                <p className="text-sm text-muted-foreground">Receive notifications for any vehicle reported stolen, regardless of location.</p>
                            </div>
                            <Switch
                                id="national-alerts"
                                checked={settings.nationalAlerts}
                                onCheckedChange={(checked) => handleSettingsChange({ nationalAlerts: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="local-alerts" className="text-base font-medium">Local Alerts</Label>
                                 <p className="text-sm text-muted-foreground">Only receive notifications for vehicles reported in your saved locations below.</p>
                            </div>
                            <Switch
                                id="local-alerts"
                                checked={settings.localAlerts}
                                onCheckedChange={(checked) => handleSettingsChange({ localAlerts: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                <Card>
                    <CardHeader>
                        <CardTitle>Local Alert Areas</CardTitle>
                        <CardDescription>Manage the geofenced locations for your local alerts. You will only receive local alerts if the option above is enabled.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                            {locations.length > 0 ? (
                                locations.map(loc => (
                                    <div key={loc.name} className="rounded-lg border bg-card p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-medium">{loc.name}</h4>
                                                <p className="text-sm text-muted-foreground">{loc.address}</p>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive -mt-2 -mr-2">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete "{loc.name}"?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete this geofence? You will no longer receive local notifications for this area.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteLocation(loc.name)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No locations saved yet for local alerts.</p>
                            )}
                        </div>
                         <Dialog open={isAddLocationDialogOpen} onOpenChange={setIsAddLocationDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="mt-6 w-full" variant="outline">Add New Location</Button>
                            </DialogTrigger>
                            <AddLocationDialog onSave={handleSaveLocation} onOpenChange={setIsAddLocationDialogOpen} />
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
}

