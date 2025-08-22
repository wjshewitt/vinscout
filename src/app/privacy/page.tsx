
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          <CardDescription>Last updated: {lastUpdated}</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none space-y-4">
            <p>
                Welcome to Vinscout. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
            </p>
            
            <h2 className="text-2xl font-bold">Information We Collect</h2>
            <p>
                We may collect personal information that you voluntarily provide to us when you register on the application, such as your name, email address, and vehicle information when you file a report. We also collect information you provide when you communicate with other users through our messaging service.
            </p>

            <h2 className="text-2xl font-bold">How We Use Your Information</h2>
            <p>
                We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
                <li>Create and manage your account.</li>
                <li>Operate and maintain the stolen vehicle recovery service.</li>
                <li>Facilitate communication between users for the purpose of vehicle recovery.</li>
                <li>Send you notifications based on your preferences.</li>
                <li>Improve our application and services.</li>
            </ul>

            <h2 className="text-2xl font-bold">Sharing Your Information</h2>
            <p>
                We do not sell your personal information. We may share information with other users as necessary to facilitate vehicle recovery (e.g., when you message a vehicle owner). We may also share information with law enforcement upon a valid legal request.
            </p>

            <h2 className="text-2xl font-bold">Contact Us</h2>
            <p>
                If you have any questions or concerns about our Privacy Policy, please do not hesitate to contact us at <a href="mailto:hewittjswill@gmail.com" className="text-primary underline">hewittjswill@gmail.com</a>.
            </p>

        </CardContent>
      </Card>
    </div>
  );
}
