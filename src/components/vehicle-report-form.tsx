
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { submitVehicleReport } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

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
});

type ReportFormValues = z.infer<typeof reportSchema>;

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);


export function VehicleReportForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedMake, setSelectedMake] = useState<string>('');
  
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

  const handleMakeChange = async (make: string) => {
    setSelectedMake(make);
    form.setValue('make', make);
    form.setValue('model', '');
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

    try {
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
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Make</FormLabel>
                <Select onValueChange={handleMakeChange} defaultValue={field.value}>
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
                <Select onValueChange={(value) => field.onChange(parseInt(value))} >
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
           <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="vin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VIN</FormLabel>
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
          </div>
          <div className="sm:col-span-2">
          <FormField
            control={form.control}
            name="features"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distinctive Features</FormLabel>
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
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location of Theft</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 123 Main St, Anytown, USA" {...field} className="h-12 rounded-lg" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                <FormLabel>Additional Information</FormLabel>
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

        <div className="sm:col-span-2">
        <FormItem>
          <FormLabel>Upload Photos</FormLabel>
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
        <div className="sm:col-span-2">
        <Button type="submit" size="lg" className="w-full h-14 text-base font-bold shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105">Alert the Network</Button>
        </div>
      </form>
    </Form>
  );
}
