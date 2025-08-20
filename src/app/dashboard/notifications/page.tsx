
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, MapPin, Search, Trash2, Minus, Plus, Redo2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';


function MapComponent({ 
    onLocationSelect, 
    initialPosition, 
    shape, 
    onShapeChange,
    shapeType
}: { 
    onLocationSelect: (location: { lat: number, lng: number, address: string }) => void, 
    initialPosition?: { lat: number, lng: number },
    shape: google.maps.Circle | google.maps.Polygon | null,
    onShapeChange: (shape: google.maps.Circle | google.maps.Polygon | null) => void,
    shapeType: 'radius' | 'polygon'
}) {
  const map = useMap();
  const drawing = useMapsLibrary('drawing');
  const { toast } = useToast();
  const [markerPos, setMarkerPos] = useState(initialPosition || { lat: 51.5072, lng: -0.1276 });
  const [searchAddress, setSearchAddress] = useState("");
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);

  useEffect(() => {
    if(!map || !drawing) return;

    const manager = new google.maps.drawing.DrawingManager({
        map,
        drawingControl: false,
        polygonOptions: {
            fillColor: "hsl(var(--primary))",
            fillOpacity: 0.3,
            strokeColor: "hsl(var(--primary))",
            strokeWeight: 2,
            editable: true,
        },
    });

    setDrawingManager(manager);

    google.maps.event.addListener(manager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
        onShapeChange(polygon);
        manager.setDrawingMode(null);
    });

    return () => {
        google.maps.event.clearInstanceListeners(manager);
        manager.setMap(null);
    };

  }, [map, drawing, onShapeChange]);
  
  useEffect(() => {
    if (drawingManager) {
        if(shapeType === 'polygon'){
            drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
        } else {
            drawingManager.setDrawingMode(null);
        }
    }
  }, [shapeType, drawingManager]);

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
  
  const handleClearDrawing = () => {
    shape?.setMap(null);
    onShapeChange(null);
    if (drawingManager) {
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
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
          {shapeType === 'polygon' && shape && (
            <Button size="icon" className="absolute bottom-4 right-4 z-10" onClick={handleClearDrawing}>
                <Redo2 className="h-4 w-4" />
            </Button>
          )}
      </div>
  );
}


function AddLocationDialog({ onSave, onOpenChange }: { onSave: (location: GeofenceLocation) => Promise<void>, onOpenChange: (open: boolean) => void }) {
  const map = useMap();
  const [name, setName] =useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number, address: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [shapeType, setShapeType] = useState<'radius' | 'polygon'>('radius');
  const [radius, setRadius] = useState(1000); // meters
  const [shape, setShape] = useState<google.maps.Circle | google.maps.Polygon | null>(null);
  const [center, setCenter] = useState({ lat: 51.5072, lng: -0.1276 });

   useEffect(() => {
    if (selectedLocation) {
      setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
    }
  }, [selectedLocation]);
  
  useEffect(() => {
    shape?.setMap(null); // Clear previous shape
    
    if(!map || shapeType === 'polygon') return;
    
    const newShape = new google.maps.Circle({
        center,
        radius,
        fillColor: "hsl(var(--primary))",
        fillOpacity: 0.3,
        strokeColor: "hsl(var(--primary))",
        strokeWeight: 2,
        map,
    });
    setShape(newShape);
    
    return () => { newShape.setMap(null) };
  }, [map, center, radius, shapeType]);

  if (!apiKey) return null;

  const handleSave = async () => {
    if (name && selectedLocation) {
        setIsSaving(true);
        let geofenceData: GeofenceLocation = {
            name,
            address: selectedLocation.address,
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            type: shapeType,
        };

        if (shapeType === 'radius') {
            geofenceData.radius = radius;
        } else if (shapeType === 'polygon' && shape instanceof google.maps.Polygon) {
            const path = shape.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
            if (path.length < 3) {
                 useToast().toast({ variant: 'destructive', title: 'Invalid Polygon', description: 'Please draw a valid shape with at least 3 points.' });
                 setIsSaving(false);
                 return;
            }
            geofenceData.path = path;
        } else {
             useToast().toast({ variant: 'destructive', title: 'Invalid Shape', description: 'Please define a radius or draw a polygon.' });
             setIsSaving(false);
             return;
        }

        try {
            await onSave(geofenceData);
            onOpenChange(false);
        } catch (error) {
             // Error toast is handled in the parent component
        } finally {
            setIsSaving(false);
        }
    }
  };
  
  const handleLocationUpdate = (loc: { lat: number, lng: number, address: string }) => {
    setSelectedLocation(loc);
    setCenter({lat: loc.lat, lng: loc.lng});
  };

  return (
    <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-0">
            <DialogTitle>Add New Geofence</DialogTitle>
            <DialogDescription>
                Define an area to receive local alerts. Choose a location and then define the area using a radius or by drawing a polygon.
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

                <Tabs value={shapeType} onValueChange={(v) => setShapeType(v as 'radius' | 'polygon')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="radius">Radius</TabsTrigger>
                        <TabsTrigger value="polygon">Polygon</TabsTrigger>
                    </TabsList>
                    <TabsContent value="radius" className="space-y-4 pt-4">
                        <Label>Radius: {(radius / 1000).toFixed(2)} km</Label>
                        <Slider
                            value={[radius]}
                            onValueChange={([val]) => setRadius(val)}
                            min={100}
                            max={50000}
                            step={100}
                        />
                         <p className="text-xs text-muted-foreground">Define a circular area around the pin.</p>
                    </TabsContent>
                    <TabsContent value="polygon" className="pt-4">
                        <p className="text-sm text-muted-foreground">Click on the map to start drawing a custom shape. Click the first point to close the shape.</p>
                    </TabsContent>
                </Tabs>

           </div>
           <div>
            <MapComponent 
                onLocationSelect={handleLocationUpdate} 
                initialPosition={center}
                shape={shape}
                onShapeChange={setShape}
                shapeType={shapeType}
            />
           </div>
        </div>
        <DialogFooter className="p-6 pt-0">
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={!name || !selectedLocation || isSaving || (shapeType === 'polygon' && !shape)}>
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
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
            const existingIndex = prev.findIndex(l => l.name === location.name);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = location;
                return updated;
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
        
        {loading || !apiKey ? (
             <div className="flex justify-center items-center py-20">
               { !apiKey ? <p className="text-destructive">Map API Key is missing.</p> : <Loader2 className="animate-spin text-primary" size={32} /> }
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
                                                 <p className="text-xs text-muted-foreground/80 mt-1">
                                                    {loc.type === 'radius' && `Radius: ${(loc.radius! / 1000).toFixed(1)}km`}
                                                    {loc.type === 'polygon' && `Polygon Area`}
                                                </p>
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
                            <APIProvider apiKey={apiKey}>
                                <AddLocationDialog onSave={handleSaveLocation} onOpenChange={setIsAddLocationDialogOpen} />
                            </APIProvider>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
}

