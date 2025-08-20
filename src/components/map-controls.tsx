
'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';

interface MapControlsProps {
  filterStatus: 'Active' | 'Recovered' | 'All';
  onFilterChange: (status: 'Active' | 'Recovered' | 'All') => void;
}

export function MapControls({ filterStatus, onFilterChange }: MapControlsProps) {
  return (
    <Card className="absolute top-4 left-4 z-10 w-full max-w-xs bg-background/80 backdrop-blur-sm">
      <CardHeader className="p-4">
        <CardTitle className="text-lg">Map Filters</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
         <RadioGroup value={filterStatus} onValueChange={onFilterChange}>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="Active" id="r-active" />
                <Label htmlFor="r-active">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="Recovered" id="r-recovered" />
                <Label htmlFor="r-recovered">Recovered</Label>
            </div>
             <div className="flex items-center space-x-2">
                <RadioGroupItem value="All" id="r-all" />
                <Label htmlFor="r-all">All</Label>
            </div>
        </RadioGroup>
        
        <Separator />

        <div>
            <h4 className="font-medium text-sm mb-2">Legend</h4>
            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(var(--muted-foreground))' }} />
                    <span>Active Report</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(var(--secondary-foreground))' }} />
                    <span>Recovered</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                    <span>Selected</span>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
