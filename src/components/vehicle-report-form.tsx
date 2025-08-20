
'use client';

import { useForm, useWatch, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, ChevronLeft, ChevronRight, Loader2, MapPin, PoundSterling, X, Search, Check, ChevronsUpDown } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { submitVehicleReport, VehicleReport, LocationInfo } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useDebouncedCallback } from 'use-debounce';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const locationSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  country: z.string().min(1, 'Country is required'),
  fullAddress: z.string().min(1, 'Full address is required'),
});

const reportSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().min(1900, 'Invalid year').max(new Date().getFullYear() + 1, 'Invalid year'),
  color: z.string().min(2, 'Color is required'),
  vin: z.string().optional(),
  licensePlate: z.string().min(2, 'License plate is required'),
  features: z.string().optional(),
  location: locationSchema,
  date: z.string().min(1, "Date is required"),
  additionalInfo: z.string().optional(),
  lat: z.number({ required_error: 'Please select a location on the map.' }),
  lng: z.number({ required_error: 'Please select a location on the map.' }),
  photos: z.array(z.string()).optional(),
  rewardAmount: z.coerce.number().optional(),
  rewardDetails: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;
type FieldName = keyof ReportFormValues;

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);

const steps: { title: string; fields: (keyof ReportFormValues)[] }[] = [
    { title: 'Vehicle Information', fields: ['make', 'model', 'year'] },
    { title: 'Vehicle Details', fields: ['color', 'licensePlate', 'vin', 'features'] },
    { title: 'Theft Details', fields: ['location', 'date', 'lat', 'lng'] },
    { title: 'Reward & Photos', fields: ['rewardAmount', 'rewardDetails', 'photos'] },
];

const parseAddressComponents = (components: google.maps.GeocoderAddressComponent[]): Partial<LocationInfo> => {
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


function LocationPicker({ onLocationChange }: { onLocationChange: (pos: { lat: number; lng: number; locationInfo: LocationInfo }) => void }) {
    const defaultPosition = { lat: 51.5072, lng: -0.1276 }; // Default to London
    const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral>(defaultPosition);
    const map = useMap();
    const { toast } = useToast();
    const form = useFormContext<ReportFormValues>();
    const [searchAddress, setSearchAddress] = useState('');

    const geocodeLocation = (location: google.maps.LatLngLiteral | string, type: 'GEOCODE' | 'REVERSE_GEOCODE') => {
        const geocoder = new google.maps.Geocoder();
        const request = type === 'GEOCODE' ? { address: location } : { location };

        geocoder.geocode(request, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const result = results[0];
                const newPos = { lat: result.geometry.location.lat(), lng: result.geometry.location.lng() };
                const locationInfo = {
                    ...parseAddressComponents(result.address_components),
                    fullAddress: result.formatted_address
                } as LocationInfo;
                 
                setMarkerPos(newPos);
                if (map) {
                    map.panTo(newPos);
                    map.setZoom(15);
                }
                 
                onLocationChange({ ...newPos, locationInfo });
                if (type === 'REVERSE_GEOCODE') {
                    setSearchAddress(result.formatted_address);
                }

            } else {
                 toast({
                     variant: 'destructive',
                     title: 'Geocoding Failed',
                     description: `Could not find a location. Please try a different address or drag the pin.`,
                 });
            }
        });
    }

    const debouncedGeocodeAddress = useDebouncedCallback((address: string) => {
        if (address) {
            geocodeLocation(address, 'GEOCODE');
        }
    }, 1000);

    const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            geocodeLocation(newPos, 'REVERSE_GEOCODE');
        }
    };
     
    useEffect(() => {
      const initialLocation = form.getValues('location');
      if (initialLocation?.fullAddress) {
        setSearchAddress(initialLocation.fullAddress);
        if(form.getValues('lat') && form.getValues('lng')) {
            setMarkerPos({lat: form.getValues('lat'), lng: form.getValues('lng')});
        }
      }
    }, [form]);


    return (
        <div className="space-y-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search for an address or drag the pin" 
                    value={searchAddress}
                    onChange={(e) => {
                        setSearchAddress(e.target.value);
                        debouncedGeocodeAddress(e.target.value);
                    }}
                    className="h-12 rounded-lg pl-10"
                />
            </div>
             
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
             
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="location.street"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Street</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value ?? ''} disabled />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="location.city"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value ?? ''} disabled />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="location.postcode"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value ?? ''} disabled />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="location.country"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value ?? ''} disabled />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        </div>
    );
}

// Helper function to compress images client-side
const compressImage = (file: File, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        };
        reader.onerror = error => reject(error);
    });
};

export function VehicleReportForm() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isMakePopoverOpen, setIsMakePopoverOpen] = useState(false);
  const [makeSearchQuery, setMakeSearchQuery] = useState('');
  const [isModelPopoverOpen, setIsModelPopoverOpen] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      make: '',
      model: '',
      color: '',
      licensePlate: '',
      vin: '',
      features: '',
      location: { street: '', city: '', postcode: '', country: '', fullAddress: '' },
      date: '',
      additionalInfo: '',
      photos: [],
      rewardAmount: undefined,
      rewardDetails: '',
    },
  });

  const selectedMake = useWatch({
    control: form.control,
    name: 'make',
  });
   
  const currentPhotos = useWatch({
    control: form.control,
    name: 'photos',
    defaultValue: []
  });

  useEffect(() => {
    setImagePreviews(currentPhotos || []);
  }, [currentPhotos]);

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
        if (parsedData.rewardAmount > 0 || parsedData.rewardDetails) {
            setShowReward(true);
        }
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem('vehicleReportForm', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);


  const handleMakeChange = useCallback(async (make: string) => {
    form.setValue('model', '');
    setModels([]);
    try {
        const response = await fetch(`/api/vehicles?make=${encodeURIComponent(make)}`);
        const data = await response.json();
        setModels(data.models || []);
    } catch (error) {
        console.error('Failed to fetch vehicle models:', error);
        setModels([]);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not load vehicle models for the selected make.',
        });
    }
  }, [form, toast]);

  useEffect(() => {
    if(selectedMake) {
        handleMakeChange(selectedMake);
    }
  }, [selectedMake, handleMakeChange]);

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
   
  const handleLocationChange = useCallback(({ lat, lng, locationInfo }: { lat: number; lng: number; locationInfo: LocationInfo }) => {
    form.setValue('lat', lat);
    form.setValue('lng', lng);
    form.setValue('location.street', locationInfo.street || '');
    form.setValue('location.city', locationInfo.city || '');
    form.setValue('location.postcode', locationInfo.postcode || '');
    form.setValue('location.country', locationInfo.country || '');
    form.setValue('location.fullAddress', locationInfo.fullAddress || '', { shouldValidate: true });
  }, [form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    toast({ title: 'Processing Images', description: 'Compressing images for upload...' });
    const newImagePromises: Promise<string>[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        newImagePromises.push(compressImage(file));
    }
     
    Promise.all(newImagePromises).then(newImages => {
        const updatedPhotos = [...(form.getValues('photos') || []), ...newImages];
        form.setValue('photos', updatedPhotos, { shouldValidate: true });
        setImagePreviews(updatedPhotos);
        setIsUploading(false);
        toast({ title: 'Images Ready', description: 'Your photos have been added to the report.' });
    }).catch(error => {
        console.error("Error processing files:", error);
        toast({ variant: 'destructive', title: 'Error processing files', description: 'There was a problem preparing your images.' });
        setIsUploading(false);
    });
  };
   
  const removeImage = (indexToRemove: number) => {
    const updatedPhotos = (form.getValues('photos') || []).filter((_, index) => index !== indexToRemove);
    form.setValue('photos', updatedPhotos, { shouldValidate: true });
    setImagePreviews(updatedPhotos);
  };

  const filteredMakes = useMemo(() => {
    if (!makeSearchQuery) return makes;
    return makes.filter(make => make.toLowerCase().includes(makeSearchQuery.toLowerCase()));
  }, [makes, makeSearchQuery]);


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
        if(data.location && (!data.lat || !data.lng)) {
             toast({
                variant: 'destructive',
                title: 'Location Incomplete',
                description: 'Please select a valid point on the map for the last known location.',
            });
            setIsSubmitting(false);
            return;
        }
     
        const reportId = await submitVehicleReport(data as Omit<VehicleReport, 'id' | 'reportedAt' | 'status' | 'reporterId' | 'sightingsCount'>);

        if (reportId) {
            toast({
              title: 'Report Submitted',
              description: 'Your stolen vehicle report has been submitted successfully.',
            });
            form.reset();
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
                            <FormItem className="flex flex-col">
                                <FormLabel>Make</FormLabel>
                                <FormControl>
                                  <Popover open={isMakePopoverOpen} onOpenChange={setIsMakePopoverOpen}>
                                      <PopoverTrigger asChild>
                                              <Button
                                                  variant="outline"
                                                  role="combobox"
                                                  className={cn(
                                                      "w-full justify-between h-12 rounded-lg",
                                                      !field.value && "text-muted-foreground"
                                                  )}
                                              >
                                                  {field.value || "Select Make"}
                                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                              </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                          <Command>
                                              <CommandInput 
                                                placeholder="Search make..."
                                                value={makeSearchQuery}
                                                onValueChange={setMakeSearchQuery}
                                              />
                                              <CommandEmpty>No make found.</CommandEmpty>
                                              <CommandList>
                                                  <CommandGroup>
                                                      {filteredMakes.map((make) => (
                                                          <CommandItem
                                                              value={make}
                                                              key={make}
                                                              onSelect={() => {
                                                                  form.setValue("make", make);
                                                                  handleMakeChange(make);
                                                                  setMakeSearchQuery('');
                                                                  setIsMakePopoverOpen(false);
                                                              }}
                                                          >
                                                              <Check
                                                                  className={cn(
                                                                      "mr-2 h-4 w-4",
                                                                      make === field.value
                                                                          ? "opacity-100"
                                                                          : "opacity-0"
                                                                  )}
                                                              />
                                                              {make}
                                                          </CommandItem>
                                                      ))}
                                                  </CommandGroup>
                                              </CommandList>
                                          </Command>
                                      </PopoverContent>
                                  </Popover>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Model</FormLabel>
                                 <FormControl>
                                  <Popover open={isModelPopoverOpen} onOpenChange={setIsModelPopoverOpen}>
                                      <PopoverTrigger asChild>
                                              <Button
                                                  variant="outline"
                                                  role="combobox"
                                                  disabled={!selectedMake}
                                                  className={cn(
                                                      "w-full justify-between h-12 rounded-lg",
                                                      !field.value && "text-muted-foreground"
                                                  )}
                                              >
                                                  {field.value || "Select or Type Model"}
                                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                              </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                          <Command shouldFilter={false}>
                                              <CommandInput 
                                                  placeholder="Search or type model..."
                                                  value={field.value}
                                                  onValueChange={(value) => form.setValue("model", value)}
                                              />
                                              <CommandEmpty>No model found. You can type a custom one.</CommandEmpty>
                                              <CommandList>
                                                  <CommandGroup>
                                                      {models.filter(model => model.toLowerCase().includes(field.value?.toLowerCase() || '')).map((model) => (
                                                          <CommandItem
                                                              value={model}
                                                              key={model}
                                                              onSelect={() => {
                                                                  form.setValue("model", model)
                                                                  setIsModelPopoverOpen(false)
                                                              }}
                                                          >
                                                              <Check
                                                                  className={cn(
                                                                      "mr-2 h-4 w-4",
                                                                      model === field.value
                                                                          ? "opacity-100"
                                                                          : "opacity-0"
                                                                  )}
                                                              />
                                                              {model}
                                                          </CommandItem>
                                                      ))}
                                                  </CommandGroup>
                                              </CommandList>
                                          </Command>
                                      </PopoverContent>
                                  </Popover>
                                </FormControl>
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
                                <Input placeholder="Enter Vehicle Identification Number" {...field} value={field.value ?? ''} className="h-12 rounded-lg" />
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
                                value={field.value ?? ''}
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
                <div className="grid grid-cols-1 gap-x-8 gap-y-6">
                    <APIProvider apiKey={apiKey}>
                        <LocationPicker onLocationChange={handleLocationChange} />
                    </APIProvider>
                     
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
                </div>
            )}
            
            {currentStep === 3 && (
                 <div className="grid grid-cols-1 gap-x-8 gap-y-6">
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <Switch id="reward-switch" checked={showReward} onCheckedChange={setShowReward} />
                            <Label htmlFor="reward-switch">Offer a reward?</Label>
                        </div>
                        {showReward && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                                <FormField
                                    control={form.control}
                                    name="rewardAmount"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reward Amount (£)</FormLabel>
                                        <div className="relative">
                                            <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <FormControl>
                                                <Input type="number" {...field} value={field.value ?? ''} className="pl-10 h-12 rounded-lg" />
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
                                        <FormLabel>Reward Details</FormLabel>
                                        <FormControl>
                                        <Textarea
                                            placeholder="e.g., Reward for information leading to recovery..."
                                            className="resize-none min-h-[100px] rounded-lg"
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </div>
                     <div>
                        <FormLabel>Upload Photos (Optional)</FormLabel>
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
                            <div className="text-center">
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                                <Label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                                >
                                    <span>{isUploading ? 'Processing...' : 'Upload files'}</span>
                                    <Input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/*" disabled={isUploading} />
                                </Label>
                                <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                         {imagePreviews.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {imagePreviews.map((src, index) => (
                                    <div key={index} className="relative group">
                                        <Image src={src} alt={`Preview ${index}`} width={150} height={150} className="rounded-lg object-cover aspect-square" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeImage(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                 </div>
            )}
        </div>
        
        <div className="flex justify-between items-center pt-8 border-t">
          <div>
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={handlePrevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Step {currentStep + 1} of {steps.length}</span>
            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={handleNextStep}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting || authLoading}>
                 {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
