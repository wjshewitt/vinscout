
'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { signInWithGoogle, signInWithEmail, AuthError } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getAdditionalUserInfo, User } from 'firebase/auth';
import { ResetPasswordDialog } from './reset-password-form';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleSuccessfulLogin = (user: User, isNewUser = false) => {
    if (isNewUser) {
        router.replace('/welcome');
    } else {
        toast({
            title: `Welcome back, ${user.displayName || 'friend'}!`,
            description: "You've successfully logged in.",
        });
        router.replace('/dashboard');
    }
  };

  async function onSubmit(data: LoginFormValues) {
    const result = await signInWithEmail(data.email, data.password);
    if (result.user) {
      handleSuccessfulLogin(result.user);
    } else if (result.error) {
       let description = 'An unknown error occurred. Please try again.';
       if (result.error.code === 'auth/invalid-credential' || result.error.code === 'auth/wrong-password' || result.error.code === 'auth/user-not-found') {
        description = 'Invalid email or password. If you signed up with Google, please try signing in with Google instead.';
       }
       toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: description,
      });
    }
  }
  
  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result) {
      const additionalInfo = getAdditionalUserInfo(result);
      handleSuccessfulLogin(result.user, additionalInfo?.isNewUser);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <ResetPasswordDialog />
                    </div>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
          <Separator className="my-4" />
           <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
            Sign In with Google
          </Button>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline text-primary">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
