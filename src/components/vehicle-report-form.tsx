
'use client';

import { useForm, useWatch, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, ChevronLeft, ChevronRight, Loader2, MapPin, PoundSterling, X, Search, Check, ChevronsUpDown, Car, Eye, Calendar, User, Flag, ShieldCheck, Pencil, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { submitVehicleReport, VehicleReport, LocationInfo } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useDebouncedCallback } from 'use-debounce';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { sub, formatISO } from 'date-fns';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/ui/image-uploader';


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
  rewardAmount: z.coerce.number().optional(),
  rewardDetails: z.string().optional(),
  photos: z.array(z.string()).optional().default([]),
});

type ReportFormValues = z.infer<typeof reportSchema>;
type FieldName = keyof ReportFormValues;

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);

const steps: { title: string; fields: (keyof ReportFormValues)[] }[] = [
    { title: 'Vehicle Information', fields: ['make', 'model', 'year'] },
    { title: 'Vehicle Details', fields: ['color', 'licensePlate', 'vin', 'features'] },
    { title: 'Theft Details', fields: ['location', 'date', 'lat', 'lng', 'rewardAmount', 'rewardDetails'] },
    { title: 'Photos', fields: ['photos'] },
    { title: 'Review & Submit', fields: [] },
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

function PreviewStep({ data, onEdit }: { data: ReportFormValues, onEdit: (step: number) => void }) {
    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      const date = new Date(`${dateString}T00:00:00.000Z`); // Treat as UTC
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    };

    const hasReward = data.rewardAmount || data.rewardDetails;
    const hasPhotos = data.photos && data.photos.length > 0;

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-center text-primary">Review Your Report</h3>
            <p className="text-center text-muted-foreground">This is how your report will appear to the public. Please review all details carefully before submitting.</p>
             <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                         <CardTitle className="text-3xl">{data.make} {data.model} ({data.year})</CardTitle>
                         <Badge variant={'default'}>Active</Badge>
                      </div>
                      <CardDescription>Reported Stolen on {formatDate(new Date().toISOString())}</CardDescription>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(0)}><Pencil className="mr-2 h-3 w-3" /> Edit</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        {hasPhotos ? (
                             <Carousel className="w-full">
                              <CarouselContent>
                                {data.photos!.map((src, index) => (
                                  <CarouselItem key={index}>
                                    <div className="aspect-video w-full relative bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                       <Image src={src} alt={`Vehicle photo ${index + 1}`} layout="fill" objectFit="cover" />
                                    </div>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              {data.photos.length > 1 && (
                                <>
                                  <CarouselPrevious />
                                  <CarouselNext />
                                </>
                              )}
                            </Carousel>
                        ) : (
                             <div className="aspect-video w-full mb-4 relative bg-muted rounded-lg flex items-center justify-center">
                                <Car className="h-16 w-16 text-muted-foreground" />
                            </div>
                        )}
                        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(3)} className="mt-2 w-full"><Pencil className="mr-2 h-3 w-3" /> Edit Photos</Button>

                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">Vehicle Details</h3>
                            <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(1)}><Pencil className="mr-2 h-3 w-3" /> Edit</Button>
                        </div>
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <span>Make:</span> <span className="text-muted-foreground">{data.make}</span>
                            <span>Model:</span> <span className="text-muted-foreground">{data.model}</span>
                            <span>Year:</span> <span className="text-muted-foreground">{data.year}</span>
                            <span>Color:</span> <span className="text-muted-foreground">{data.color}</span>
                            <span>License Plate:</span><span className="font-mono">{data.licensePlate}</span>
                            {data.vin && <><span>VIN:</span> <span className="font-mono text-muted-foreground">{data.vin}</span></>}
                            </div>
                        </div>
                      </div>
                      <Separator />
                       {hasReward && (
                         <>
                            <div>
                                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                   <Badge variant="secondary" className="bg-green-700/20 text-green-400 border-green-700/40">
                                     <PoundSterling className="h-4 w-4 mr-1" />
                                     Reward Offered
                                   </Badge>
                                </h3>
                                {data.rewardAmount && data.rewardAmount > 0 && (
                                    <p className="text-2xl font-bold text-primary">£{data.rewardAmount.toLocaleString()}</p>
                                )}
                                {data.rewardDetails && <p className="text-sm text-muted-foreground mt-1">{data.rewardDetails}</p>}
                            </div>
                            <Separator />
                         </>
                       )}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">Last Known Information</h3>
                             <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(2)}><Pencil className="mr-2 h-3 w-3" /> Edit</Button>
                        </div>
                        <p className="text-sm"><strong>Date of Theft:</strong> {formatDate(data.date)}</p>
                        <p className="text-sm"><strong>Original Location:</strong> {data.location.fullAddress}</p>
                        <p className="text-sm mt-2"><strong>Details:</strong> {data.features || 'No additional details provided.'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function VehicleReportForm() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  const [isMakePopoverOpen, setIsMakePopoverOpen] = useState(false);
  const [isModelPopoverOpen, setIsModelPopoverOpen] = useState(false);
  const [isYearPopoverOpen, setIsYearPopoverOpen] = useState(false);

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
      rewardAmount: undefined,
      rewardDetails: '',
      photos: [],
    },
  });

  const selectedMake = useWatch({
    control: form.control,
    name: 'make',
  });
  
  const photoUrls = useWatch({
    control: form.control,
    name: 'photos',
    defaultValue: [],
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
        try {
            const parsedData = JSON.parse(savedFormData);
            form.reset(parsedData);
        } catch (e) {
            console.error("Could not parse saved form data", e);
            localStorage.removeItem('vehicleReportForm');
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
      if (fields.length > 0) {
        const isValid = await form.trigger(fields as FieldName[], { shouldFocus: true });
        if (!isValid) {
          return;
        }
      }
      if (currentStep < steps.length - 1) {
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
  
  const setDatePreset = (unit: 'days' | 'weeks' | 'months', amount: number) => {
      const newDate = sub(new Date(), { [unit]: amount });
      form.setValue('date', formatISO(newDate, { representation: 'date' }));
  }

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
            setCurrentStep(2); // Go back to location step
            return;
        }
     
        const reportId = await submitVehicleReport({ ...data, reporterId: user.uid });

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
   
  const renderStepContent = () => {
    switch(currentStep) {
        case 0:
            return (
                 <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="make"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Make</FormLabel>
                                  <Popover open={isMakePopoverOpen} onOpenChange={setIsMakePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
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
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput 
                                              placeholder="Search make..."
                                            />
                                            <CommandEmpty>No make found.</CommandEmpty>
                                            <CommandList>
                                                <CommandGroup>
                                                    {makes.map((make) => (
                                                        <CommandItem
                                                            value={make}
                                                            key={make}
                                                            onSelect={() => {
                                                                form.setValue("make", make);
                                                                handleMakeChange(make);
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
                                  <Popover open={isModelPopoverOpen} onOpenChange={setIsModelPopoverOpen}>
                                      <PopoverTrigger asChild>
                                        <FormControl>
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
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                          <Command
                                            filter={(value, search) => {
                                                if (value.toLowerCase().includes(search.toLowerCase())) return 1
                                                return 0
                                            }}
                                          >
                                              <CommandInput 
                                                  placeholder="Search or type model..."
                                                  onValueChange={field.onChange}
                                                  value={field.value}
                                              />
                                              <CommandEmpty>No model found. You can type a custom one.</CommandEmpty>
                                              <CommandList>
                                                  <CommandGroup>
                                                      {models.map((model) => (
                                                          <CommandItem
                                                              value={model}
                                                              key={model}
                                                              onSelect={(currentValue) => {
                                                                  form.setValue("model", currentValue === field.value ? "" : currentValue)
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
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Year</FormLabel>
                                <Popover open={isYearPopoverOpen} onOpenChange={setIsYearPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between h-12 rounded-lg",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value || "Select Year"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search year..." />
                                            <CommandEmpty>No year found.</CommandEmpty>
                                            <CommandList>
                                                <CommandGroup>
                                                    {years.map((year) => (
                                                        <CommandItem
                                                            value={year.toString()}
                                                            key={year}
                                                            onSelect={() => {
                                                                form.setValue("year", year);
                                                                setIsYearPopoverOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    year === field.value
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            {year}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
            );
        case 1:
            return (
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
            );
        case 2:
            return (
                <div className="space-y-6">
                    <APIProvider apiKey={apiKey}>
                        <LocationPicker onLocationChange={handleLocationChange} />
                    </APIProvider>
                     
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date of Theft</FormLabel>
                             <p className="text-sm text-muted-foreground">If you do not know exactly when the vehicle was stolen, please estimate or choose one of the below options.</p>
                            <FormControl>
                                <Input type="date" {...field} className="h-12 rounded-lg" />
                            </FormControl>
                             <div className="flex gap-2 pt-2">
                                <Button type="button" size="sm" variant="outline" onClick={() => setDatePreset('days', 1)}>Today</Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => setDatePreset('weeks', 1)}>Last Week</Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => setDatePreset('months', 1)}>Last Month</Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                      <Separator />
                        <div>
                            <h3 className="text-lg font-medium">Offer a Reward (Optional)</h3>
                            <p className="text-sm text-muted-foreground">You can offer a reward for information that leads to the recovery of your vehicle.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="rewardAmount"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reward Amount (£)</FormLabel>
                                    <div className="relative">
                                        <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <FormControl>
                                            <Input type="number" {...field} className="pl-10 h-12 rounded-lg" value={field.value ?? ''}/>
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="rewardDetails"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reward Details</FormLabel>
                                <FormControl>
                                <Textarea
                                    placeholder="e.g., Reward for information leading to recovery..."
                                    className="resize-none rounded-lg"
                                    {...field}
                                    value={field.value ?? ''}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                </div>
            );
        case 3:
          return (
             <div className="space-y-6">
              {user ? (
                <ImageUploader
                  userId={user.uid}
                  imageUrls={photoUrls || []}
                  onUrlsChange={(urls) => form.setValue('photos', urls, { shouldValidate: true, shouldDirty: true })}
                />
              ) : (
                <div className="flex items-center justify-center p-8 bg-muted/50 border border-dashed rounded-lg">
                  <p className="text-muted-foreground">Please log in to upload photos.</p>
                </div>
              )}
            </div>
          );
        case 4:
          return <PreviewStep data={form.getValues()} onEdit={(step) => setCurrentStep(step)} />;
        default:
            return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
            {renderStepContent()}
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
