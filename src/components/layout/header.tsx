
'use client';

import Link from 'next/link';
import { Bell, Menu, MessageSquare } from 'lucide-react';
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
import { useAuth } from '@/hooks/use-auth';
import { listenToUnreadCount, logout } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useEffect, useState } from 'react';

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="size-8 text-primary">
        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
        </svg>
      </div>
      <h2 className="text-2xl font-bold tracking-tighter">AutoFind</h2>
    </Link>
  )
}


export function Header() {
  const { user, loading } = useAuth();
  const isLoggedIn = !!user;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/map', label: 'Live Map' },
    { href: '/about', label: 'About' },
    { href: '/community', label: 'Community' },
  ];

  const loggedInNavLinks = [
    ...navLinks,
    { href: '/dashboard/messages', label: 'Messages' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 px-4 md:px-10 py-3 backdrop-blur">
      <div className="container flex h-14 max-w-7xl items-center justify-between mx-auto">
        <div className="flex items-center gap-6">
          <Logo />
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
            {(isLoggedIn ? loggedInNavLinks : navLinks).map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {loading ? null : isLoggedIn ? (
              <>
                <NotificationMenu />
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
                {(isLoggedIn ? loggedInNavLinks : navLinks).map((link) => (
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
     <div className="h-10 w-10 rounded-full bg-cover bg-center bg-no-repeat ring-2 ring-primary ring-offset-2 ring-offset-background" style={{backgroundImage: `url(${user.photoURL || `https://placehold.co/40x40.png`})`}}></div>
  );

  if (isMobile) {
    return (
      <div className="border-t pt-4">
        <div className="flex items-center gap-4 mb-4">
           <div className="h-10 w-10 rounded-full bg-cover bg-center bg-no-repeat" style={{backgroundImage: `url(${user.photoURL || `https://placehold.co/40x40.png`})`}}></div>
          <div>
            <p className="font-semibold">{user.displayName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Link href="/dashboard" className="w-full block text-muted-foreground transition-colors hover:text-primary py-2">Dashboard</Link>
        <Link href="/report" className="w-full block text-muted-foreground transition-colors hover:text-primary py-2">Report Vehicle</Link>
        <Link href="/dashboard/settings" className="w-full block text-muted-foreground transition-colors hover:text-primary py-2">Settings</Link>
        <Button variant="ghost" className="w-full justify-start px-0" onClick={handleLogout}>Log Out</Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
           <div className="h-10 w-10 rounded-full bg-cover bg-center bg-no-repeat" style={{backgroundImage: `url(${user.photoURL || `https://placehold.co/40x40.png`})`}}></div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/dashboard">Dashboard</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/report">Report Vehicle</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/dashboard/settings">Settings</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


function NotificationMenu() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
      if (user) {
        const unsubscribe = listenToUnreadCount(user.uid, (count) => {
          setUnreadCount(count);
        });
        return () => unsubscribe();
      }
    }, [user]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                 <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                        {unreadCount}
                    </span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="p-4 font-medium border-b">Notifications</div>
                <div className="p-4">
                    {unreadCount === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">You have no new notifications.</p>
                    ) : (
                        <div className="space-y-2">
                           {/* In a real app, you would list notifications here */}
                           <p className="text-sm text-muted-foreground">You have {unreadCount} unread messages.</p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
