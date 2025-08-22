
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="mx-auto max-w-lg w-full text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/20 p-4 rounded-full w-fit mb-4">
            <MailCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">Verify Your Email</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Please check your inbox to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-8">
            We've sent a verification link to the email address you provided. Please click the link in that email to activate your account. You may need to check your spam folder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Button asChild size="lg">
                <Link href="/login">Return to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    