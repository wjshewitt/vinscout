
'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto py-6 px-4 md:px-10 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Vinchaser. All rights reserved.</p>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <a href="mailto:hewittjswill@gmail.com" className="hover:text-foreground transition-colors">Contact Us</a>
          <a href='https://ko-fi.com/autofind' target='_blank' rel="noopener noreferrer">
            <img height='28' style={{border: '0px', height: '28px'}} src='https://storage.ko-fi.com/cdn/kofi2.png?v=3' alt='Buy Me a Coffee at ko-fi.com' />
          </a>
        </div>
      </div>
    </footer>
  );
}
