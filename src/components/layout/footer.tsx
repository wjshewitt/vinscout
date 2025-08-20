
'use client';

import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '../ui/button';


export function Footer() {

  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto py-6 px-4 md:px-10 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Vinchaser. All rights reserved.</p>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <a href="mailto:hewittjswill@gmail.com" className="hover:text-foreground transition-colors">Contact Us</a>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Support Me</Button>
            </DialogTrigger>
            <DialogContent className="p-0 max-w-2xl h-[720px] bg-transparent border-0">
                <iframe id='kofiframe' src='https://ko-fi.com/autofind/?hidefeed=true&widget=true&embed=true&preview=true' className='h-full w-full rounded-lg' style={{border:'none', background:'#f9f9f9;'}} title='autofind'></iframe>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </footer>
  );
}
