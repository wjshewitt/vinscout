
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <CardDescription>Last updated: {lastUpdated}</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none space-y-4">
          <p className="font-bold text-destructive/80">
            Disclaimer: I am an AI assistant. The following Terms of Service is a template and not legal advice. You should consult with a legal professional to ensure your Terms of Service are compliant with all applicable laws and regulations.
          </p>

          <h2 className="text-2xl font-bold pt-4">1. Introduction</h2>
          <p>
            Welcome to Vinchaser ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our application and services. By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
          </p>

          <h2 className="text-2xl font-bold">2. User Accounts</h2>
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service. You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
          </p>

          <h2 className="text-2xl font-bold">3. User Conduct and Responsibilities</h2>
          <p>
            You agree not to use the service for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the service in any way that could damage the service, the reputation of Vinchaser, or the general business of Vinchaser.
          </p>
           <ul className="list-disc pl-6 space-y-2">
                <li>You are solely responsible for your interactions with other users. We are not responsible for the conduct of any user.</li>
                <li>You must not post false, misleading, or inaccurate information, including vehicle reports or sightings.</li>
                <li><span className="font-bold">Crucially, you must not attempt to recover a vehicle yourself or confront any individuals. Always contact law enforcement for any vehicle recovery. Your safety is your responsibility.</span></li>
            </ul>

          <h2 className="text-2xl font-bold">4. Content</h2>
          <p>
            Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the service, including its legality, reliability, and appropriateness. By posting Content to the service, you grant us the right and license to use, modify, publicly display, and distribute such Content on and through the service.
          </p>

          <h2 className="text-2xl font-bold">5. Disclaimers and Limitation of Liability</h2>
          <p>
            Our service is provided on an "AS IS" and "AS AVAILABLE" basis. Vinchaser makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
          <p>
            In no event shall Vinchaser or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Vinchaser's website, even if Vinchaser or a Vinchaser authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>

          <h2 className="text-2xl font-bold">6. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law provisions.
          </p>

           <h2 className="text-2xl font-bold">7. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </p>

          <h2 className="text-2xl font-bold">Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at <a href="mailto:hewittjswill@gmail.com" className="text-primary underline">hewittjswill@gmail.com</a>.
          </p>

        </CardContent>
      </Card>
    </div>
  );
}
