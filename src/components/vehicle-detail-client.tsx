
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { VehicleReport, createOrGetConversation, sendMessage } from '@/lib/firebase';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const formatDateUTC = (dateString: string, options: Intl.DateTimeFormatOptions) => {
    if (!dateString) return 'N/A';
    const safeDateString = dateString.includes('T') ? dateString : `${dateString}T00:00:00.000Z`;
    const date = new Date(safeDateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });
};


export function VehicleDetailClient({ vehicle }: { vehicle: VehicleReport }) {
  const { user, loading: authLoading } = useAuth();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const isLoggedIn = !!user;

  const formatReportedAt = (date: string) => {
     return formatDateUTC(date, { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
   const formatTheftDate = (date: string) => {
     return formatDateUTC(date, { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const handleSendMessage = async () => {
    if (!user || !message.trim()) return;
    setIsSending(true);
    try {
        const conversationId = await createOrGetConversation(vehicle, user);
        await sendMessage(conversationId, message, user);
        
        toast({
            title: "Message Sent!",
            description: "Your message has been sent to the vehicle owner.",
        });
        
        setIsDialogOpen(false);
        setMessage('');
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
  }

  return (
    <div className="container mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{vehicle.make} {vehicle.model} ({vehicle.year})</CardTitle>
          <CardDescription>Reported Stolen on {formatReportedAt(vehicle.reportedAt)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="aspect-video w-full mb-4">
                <Image
                  src={vehicle.photos?.[0] || 'https://placehold.co/800x600.png'}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  width={800}
                  height={600}
                  className="rounded-lg object-cover w-full h-full"
                  data-ai-hint="car side"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(vehicle.photos || []).slice(1, 3).map((photo, index) => (
                  <Image
                    key={index}
                    src={photo}
                    alt={`${vehicle.make} ${vehicle.model} photo ${index + 2}`}
                    width={400}
                    height={300}
                    className="rounded-lg object-cover"
                    data-ai-hint="car detail"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span>Make:</span> <span className="text-muted-foreground">{vehicle.make}</span>
                  <span>Model:</span> <span className="text-muted-foreground">{vehicle.model}</span>
                  <span>Year:</span> <span className="text-muted-foreground">{vehicle.year}</span>
                  <span>Color:</span> <span className="text-muted-foreground">{vehicle.color}</span>
                  <span>License Plate:</span> <span className="font-mono text-muted-foreground">{vehicle.licensePlate}</span>
                  {vehicle.vin && <><span>VIN:</span> <span className="font-mono text-muted-foreground">{vehicle.vin}</span></>}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Last Known Information</h3>
                <p className="text-sm"><strong>Date of Theft:</strong> {formatTheftDate(vehicle.date)}</p>
                <p className="text-sm"><strong>Location:</strong> {vehicle.location}</p>
                <p className="text-sm mt-2"><strong>Details:</strong> {vehicle.features || 'No additional details provided.'}</p>
              </div>
              <Separator />
              <div>
                {authLoading ? (
                  <Loader2 className="animate-spin text-primary" />
                ) : isLoggedIn && vehicle.reporterId !== user.uid ? (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4" /> Message Owner
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Send a message to the owner</DialogTitle>
                        <DialogDescription>
                          Provide any information that could help locate the vehicle. Your message will be sent securely.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid w-full gap-1.5">
                          <Label htmlFor="message">Your message</Label>
                          <Textarea placeholder="Type your message here." id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" onClick={handleSendMessage} disabled={isSending || !message.trim()}>
                            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Send Message
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : isLoggedIn && vehicle.reporterId === user.uid ? (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">This is your report.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Have information? <Link href="/login" className="font-bold text-primary underline">Log in</Link> to contact the owner.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
