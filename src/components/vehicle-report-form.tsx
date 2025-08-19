
'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, ChevronLeft, ChevronRight, Loader2, MapPin } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { submitVehicleReport } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useDebouncedCallback } from 'use-debounce';

const reportSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().min(1900, 'Invalid year').max(new Date().getFullYear() + 1, 'Invalid year'),
  color: z.string().min(2, 'Color is required'),
  vin: z.string().optional(),
  licensePlate: z.string().min(2, 'License plate is required'),
  features: z.string().optional(),
  location: z.string().min(2, "Location is required"),
  date: z.string().min(1, "Date is required"),
  additionalInfo: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;
type FieldName = keyof ReportFormValues;

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);

const steps: { title: string; fields: FieldName[] }[] = [
    { title: 'Vehicle Information', fields: ['make', 'model', 'year'] },
    { title: 'Vehicle Details', fields: ['color', 'licensePlate', 'vin', 'features'] },
    { title: 'Theft Details', fields: ['location', 'date', 'lat', 'lng'] },
    { title: 'Upload Photos', fields: [] },
];

function LocationPicker({ onLocationChange }: { onLocationChange: (pos: { lat: number; lng: number; address: string }) => void }) {
    const defaultPosition = { lat: 51.5072, lng: -0.1276 }; // Default to London
    const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral>(defaultPosition);
    const map = useMap();
    const { toast } = useToast();

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
                }
                onLocationChange({ ...newPos, address: results[0].formatted_address });
            } else {
                 toast({
                     variant: 'destructive',
                     title: 'Geocoding Failed',
                     description: `Could not find a location for the address: ${address}. Please be more specific.`,
                 });
            }
        });
    }, 1000);

    const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setMarkerPos(newPos);
            // Reverse geocode to get address from lat/lng
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: newPos }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    onLocationChange({ ...newPos, address: results[0].formatted_address });
                }
            });
        }
    };
    
    const locationValue = useWatch<ReportFormValues>({ name: 'location' });
    useEffect(() => {
        if (locationValue) {
            geocodeAddress(locationValue);
        }
    }, [locationValue, geocodeAddress]);


    return (
        <div className="space-y-4">
            <FormField
                name="location"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Last Known Location</FormLabel>
                     <FormControl>
                        <Input placeholder="e.g., 123 Main St, Anytown, USA" {...field} className="h-12 rounded-lg" />
                     </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <div className="h-64 w-full rounded-lg overflow-hidden border">
                <Map
                    defaultCenter={markerPos}
                    defaultZoom={12}
                    mapId="report_form_map"
                    gestureHandling="greedy"
                    disableDefaultUI={true}
                >
                    <AdvancedMarker position={markerPos} draggable={true} onDragEnd={handleMarkerDragEnd}>
                        <MapPin size={32} className="text-primary" />
                    </AdvancedMarker>
                </Map>
            </div>
             <p className="text-sm text-muted-foreground">Type an address or drag the pin to the exact location of the theft.</p>
        </div>
    );
}

export function VehicleReportForm() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;


  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      make: '',
      model: '',
      color: '',
      licensePlate: '',
      vin: '',
      features: '',
      location: '',
      date: '',
      additionalInfo: '',
    },
  });

  useEffect(() => {
    const fetchMakes = async () => {
      try {
        const response = await fetch('/api/vehicles');
        const data = await response.json();
        setMakes(data.makes);
      } catch (error) {
        console.error('Failed to fetch vehicle makes:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load vehicle manufacturers.',
        });
      }
    };
    fetchMakes();
  }, [toast]);
  
  useEffect(() => {
    const savedFormData = localStorage.getItem('vehicleReportForm');
    if (savedFormData) {
        const parsedData = JSON.parse(savedFormData);
        form.reset(parsedData);
        if (parsedData.make) {
            handleMakeChange(parsedData.make, false);
        }
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem('vehicleReportForm', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);


  const handleMakeChange = async (make: string, shouldResetModel = true) => {
    setSelectedMake(make);
    form.setValue('make', make);
    if (shouldResetModel) {
        form.setValue('model', '');
    }
    setModels([]);
    if (make) {
      try {
        const response = await fetch(`/api/vehicles?make=${encodeURIComponent(make)}`);
        const data = await response.json();
        setModels(data.models);
      } catch (error) {
        console.error('Failed to fetch vehicle models:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load vehicle models for the selected make.',
        });
      }
    }
  };

  const handleNextStep = async () => {
      const fields = steps[currentStep].fields;
      const isValid = await form.trigger(fields as FieldName[], { shouldFocus: true });
      if (isValid) {
        setCurrentStep(prev => prev + 1);
      }
  };

  const handlePrevStep = () => {
      setCurrentStep(prev => prev - 1);
  };
  
  const handleLocationChange = useCallback(({ lat, lng, address }: { lat: number; lng: number; address: string }) => {
    form.setValue('lat', lat);
    form.setValue('lng', lng);
    form.setValue('location', address, { shouldValidate: true });
  }, [form]);


  async function onSubmit(data: ReportFormValues) {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Authentication Required',
            description: 'You must be logged in to report a vehicle.',
        });
        router.push('/login');
        return;
    }
    
    setIsSubmitting(true);

    try {
        // Ensure lat/lng are set if location is present
        if(data.location && (!data.lat || !data.lng)) {
             toast({
                variant: 'destructive',
                title: 'Location Incomplete',
                description: 'Please select a valid point on the map for the last known location.',
            });
            setIsSubmitting(false);
            return;
        }
    
        const reportId = await submitVehicleReport({
            ...data,
            reportedAt: new Date(),
            status: 'Active',
            reporterId: user.uid
        });

        if (reportId) {
            toast({
              title: 'Report Submitted',
              description: 'Your stolen vehicle report has been submitted successfully.',
            });
            form.reset();
            setSelectedMake('');
            localStorage.removeItem('vehicleReportForm');
            router.push(`/vehicles/${reportId}`);
        } else {
            throw new Error("Submission failed to return an ID.");
        }
    } catch (error) {
        console.error("Error submitting report: ", error);
        toast({
            variant: 'destructive',
            title: 'Submission Failed',
            description: 'There was an error submitting your report. Please try again.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (!apiKey) {
    return (
        <div className="flex items-center justify-center p-8 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-destructive text-center">Google Maps API key is missing. The report form cannot be displayed.</p>
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
            {currentStep === 0 && (
                 <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="make"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Make</FormLabel>
                            <Select onValueChange={(value) => handleMakeChange(value, true)} value={field.value}>
                            <FormControl>
                                <SelectTrigger className="h-12 rounded-lg">
                                <SelectValue placeholder="Select Make" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {makes.map((make) => (
                                <SelectItem key={make} value={make}>{make}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Model</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedMake || models.length === 0}>
                            <FormControl>
                                <SelectTrigger className="h-12 rounded-lg">
                                <SelectValue placeholder="Select Model" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {models.map((model) => (
                                <SelectItem key={model} value={model}>{model}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Year</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} value={field.value?.toString()}>
                            <FormControl>
                                <SelectTrigger className="h-12 rounded-lg">
                                <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
            )}
             {currentStep === 1 && (
                 <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Python Green" {...field} className="h-12 rounded-lg" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="licensePlate"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>License Plate Number</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter License Plate Number" {...field} className="h-12 rounded-lg" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="sm:col-span-2">
                    <FormField
                        control={form.control}
                        name="vin"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>VIN (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter Vehicle Identification Number" {...field} className="h-12 rounded-lg" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    <div className="sm:col-span-2">
                    <FormField
                        control={form.control}
                        name="features"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Distinctive Features (Optional)</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="e.g., Carbon fiber roof, aftermarket wheels, small dent on rear bumper"
                                className="resize-none min-h-[100px] rounded-lg"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                </div>
            )}

            {currentStep === 2 && (
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <APIProvider apiKey={apiKey}>
                           <LocationPicker onLocationChange={handleLocationChange} />
                        </APIProvider>
                    </div>
                    
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date of Theft</FormLabel>
                            <FormControl>
                            <Input type="date" {...field} className="h-12 rounded-lg" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <div className="sm:col-span-2">
                        <FormField
                            control={form.control}
                            name="additionalInfo"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Additional Information (Optional)</FormLabel>
                                <FormControl>
                                <Textarea
                                    placeholder="Provide any other details that might be helpful"
                                    className="resize-none min-h-[100px] rounded-lg"
                                    {...field}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                </div>
            )}

            {currentStep === 3 && (
                 <div className="sm:col-span-2">
                    <FormItem>
                    <FormLabel>Upload Photos (Optional)</FormLabel>
                    <FormControl>
                        <div className="relative flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-input bg-background p-8 transition-colors hover:border-primary">
                        <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-sm text-muted-foreground">
                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG, GIF up to 10MB
                        </p>
                        </div>
                        <input id="photos" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" multiple disabled />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                </div>
            )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {currentStep > 0 && (
                  <Button type="button" variant="outline" onClick={handlePrevStep}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
              )}
            </div>
             <div className="flex-1 text-center text-sm font-medium text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
            </div>
            <div>
              {currentStep < steps.length - 1 && (
                  <Button type="button" onClick={handleNextStep}>
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
              )}
              {currentStep === steps.length - 1 && (
                  <Button type="submit" size="lg" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-105" disabled={authLoading || isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : (authLoading ? 'Authenticating...' : 'Alert the Network')}
                  </Button>
              )}
            </div>
        </div>

      </form>
    </Form>
  );
}
