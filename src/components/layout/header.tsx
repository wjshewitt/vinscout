'use client';

import Link from 'next/link';
import { Bell, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { logout } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="hsl(var(--primary))"/>
        <path d="M12 20L16 12L20 20" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 20L18 16" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="font-bold text-lg">AutoFind</span>
    </Link>
  )
}


export function Header() {
  const { user, loading } = useAuth();
  const isLoggedIn = !!user;

  const navLinks = [
    { href: '/report', label: 'Report Theft' },
    { href: '/map', label: 'Live Map' },
    { href: '/community', label: 'Community' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors text-muted-foreground hover:text-primary">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {loading ? null : isLoggedIn ? (
              <>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
                <UserMenu />
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="grid gap-6 text-lg font-medium mt-8">
                <Logo />
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="text-muted-foreground transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                ))}
                 <div className="flex flex-col gap-4 mt-4">
                  {loading ? null : isLoggedIn ? (
                     <UserMenu isMobile={true} />
                  ) : (
                    <>
                      <Button variant="ghost" asChild>
                        <Link href="/login">Log In</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/signup">Sign Up</Link>
                      </Button>
                    </>
                  )}
                 </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}


function UserMenu({ isMobile = false }) {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) return null;

  const menuTrigger = (
    <Avatar className="h-9 w-9 cursor-pointer">
      <AvatarImage src={user.photoURL || `https://placehold.co/40x40.png`} alt={user.displayName || 'User'} />
      <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
    </Avatar>
  );

  if (isMobile) {
    return (
      <div className="border-t pt-4">
        <div className="flex items-center gap-4 mb-4">
          <Avatar>
             <AvatarImage src={user.photoURL || `https://placehold.co/40x40.png`} alt={user.displayName || 'User'} />
             <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user.displayName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Link href="/dashboard" className="w-full block text-muted-foreground transition-colors hover:text-primary py-2">Dashboard</Link>
        <Link href="/dashboard/messages" className="w-full block text-muted-foreground transition-colors hover:text-primary py-2">Messages</Link>
        <Link href="/dashboard/notifications" className="w-full block text-muted-foreground transition-colors hover:text-primary py-2">Settings</Link>
        <Button variant="ghost" className="w-full justify-start px-0" onClick={handleLogout}>Log Out</Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {menuTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/dashboard">Dashboard</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/dashboard/messages">Messages</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/dashboard/notifications">Settings</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
