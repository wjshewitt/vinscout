
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function NotificationsPage() {
  const { toast } = useToast();

  const handleSaveChanges = () => {
    // In a real app, you would save these preferences to a user profile in Firestore.
    toast({
      title: "Preferences Saved",
      description: "Your notification settings have been updated.",
    });
  };

  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Choose how you want to be alerted about stolen vehicles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <Label htmlFor="geo-fence" className="flex flex-col space-y-1">
              <span>Geo-fenced Alerts</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive notifications when a reported vehicle is near you.
              </span>
            </Label>
            <Switch id="geo-fence" defaultChecked />
          </div>
          <div className="space-y-4 p-4 border rounded-lg">
            <Label className="text-base">Notification Scope</Label>
            <RadioGroup defaultValue="local" className="flex flex-col space-y-2">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="local" id="local" />
                <Label htmlFor="local" className="font-normal">Local (within 50 miles)</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="nationwide" id="nationwide" />
                <Label htmlFor="nationwide" className="font-normal">Nationwide</Label>
              </div>
            </RadioGroup>
          </div>
           <Button onClick={handleSaveChanges}>Save Preferences</Button>
        </CardContent>
      </Card>
    </div>
  );
}
