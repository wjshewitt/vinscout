
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordReset, AuthError } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import * as z from 'zod';

const emailSchema = z.string().email({ message: "Please enter a valid email address." });

export function ResetPasswordDialog() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleResetPassword = async () => {
    const validationResult = emailSchema.safeParse(email);
    if (!validationResult.success) {
      setError(validationResult.error.errors[0].message);
      return;
    }
    
    setError('');
    setIsSending(true);
    const result = await sendPasswordReset(email);
    setIsSending(false);

    if (result.success) {
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox for instructions to reset your password.',
      });
      setIsDialogOpen(false);
      setEmail('');
    } else {
        let description = 'An unknown error occurred. Please try again.';
        if (result.error?.code === 'auth/user-not-found') {
            description = 'No account found with that email address.';
        }
       toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: description,
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-xs">
          Forgot your password?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter your email address and we will send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleResetPassword} disabled={isSending}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
