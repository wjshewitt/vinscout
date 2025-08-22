
'use client';

import Link from 'next/link';
import { Bell, Menu, MessageSquare, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/hooks/use-auth';
import { logout, listenToConversations, Conversation, listenToSystemNotifications, SystemNotification, markSystemNotificationsAsRead } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="size-8 text-primary">
        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
        </svg>
      </div>
      <h2 className="text-2xl font-bold tracking-tighter font-mono">Vinscout</h2>
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
        <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-8">
                {(isLoggedIn ? loggedInNavLinks : navLinks).map((link) => (
                  <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                ))}
              </nav>
        </div>
        
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
               <SheetHeader>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              </SheetHeader>
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
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
    });
    router.push('/');
  };

  if (!user) return null;

  if (isMobile) {
    return (
      <div className="border-t pt-4">
        <div className="flex items-center gap-4 mb-4">
           <Avatar>
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} data-ai-hint="person face" />
                <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
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
           <Avatar>
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} data-ai-hint="person face" />
                <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
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
    const [unreadConversations, setUnreadConversations] = useState<Conversation[]>([]);
    const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);

    useEffect(() => {
      if (user) {
        const unsubConversations = listenToConversations(user.uid, (conversations) => {
          const unread = conversations.filter(c => c.unread?.[user.uid] && c.unread[user.uid] > 0);
          unread.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
          setUnreadConversations(unread);
        });

        const unsubSystemNotifs = listenToSystemNotifications(user.uid, setSystemNotifications);

        return () => {
          unsubConversations();
          unsubSystemNotifs();
        }
      }
    }, [user]);
    
    const unreadSystemNotifications = systemNotifications.filter(n => !n.isRead);
    const totalUnreadConversations = unreadConversations.reduce((acc, convo) => acc + (convo.unread?.[user?.uid || ''] || 0), 0);
    const totalUnreadCount = totalUnreadConversations + unreadSystemNotifications.length;

    const handleOpenChange = (open: boolean) => {
        if (open && unreadSystemNotifications.length > 0 && user) {
            // Mark system notifications as read
            markSystemNotificationsAsRead(user.uid, unreadSystemNotifications.map(n => n.id));
        }
    }

    const allNotifications = [
        ...unreadConversations.map(c => ({...c, type: 'conversation', date: new Date(c.lastMessageAt)})),
        ...systemNotifications.map(n => ({...n, type: 'system', date: new Date(n.createdAt)}))
    ].sort((a,b) => b.date.getTime() - a.date.getTime());


    return (
        <Popover onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                 <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {totalUnreadCount > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                        {totalUnreadCount}
                    </span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="p-4 font-medium border-b">Notifications</div>
                <div className="p-2 max-h-80 overflow-y-auto">
                    {allNotifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">You have no new notifications.</p>
                    ) : (
                        <div className="space-y-1">
                           {allNotifications.map(item => {
                               if(item.type === 'conversation') {
                                   const convo = item as Conversation;
                                   const otherParticipantId = convo.participants.find(p => p !== user?.uid);
                                   const otherParticipant = otherParticipantId ? convo.participantDetails[otherParticipantId] : { name: 'Unknown', avatar: ''};
                                   const unreadCount = user && convo.unread ? convo.unread[user.uid] || 0 : 0;
                                   
                                   return (
                                       <Link href={`/dashboard/messages?conversationId=${convo.id}`} key={convo.id} className="block p-2 rounded-lg hover:bg-accent">
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} data-ai-hint="person face" />
                                                    <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 text-sm">
                                                    <p><span className="font-bold">{otherParticipant.name}</span> sent you a message</p>
                                                    <p className="text-muted-foreground text-xs mt-1">{formatDistanceToNow(new Date(convo.lastMessageAt), { addSuffix: true })}</p>
                                                </div>
                                                {unreadCount > 0 && 
                                                    <div className="flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 ml-2 self-center">
                                                        {unreadCount}
                                                    </div>
                                                }
                                            </div>
                                       </Link>
                                   )
                               } else {
                                   const notif = item as SystemNotification;
                                   return (
                                     <Link href={notif.link} key={notif.id} className="block p-2 rounded-lg hover:bg-accent">
                                          <div className="flex items-start gap-3">
                                              <div className="h-10 w-10 flex items-center justify-center">
                                                 <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                    <Car className="h-4 w-4 text-blue-400" />
                                                 </div>
                                              </div>
                                              <div className="flex-1 text-sm">
                                                  <p className="font-bold">{notif.title}</p>
                                                  <p>{notif.message}</p>
                                                  <p className="text-muted-foreground text-xs mt-1">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</p>
                                              </div>
                                               {!notif.isRead && 
                                                    <div className="mt-2.5 h-2 w-2 rounded-full bg-primary" />
                                                }
                                          </div>
                                     </Link>
                                   )
                               }
                           })}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
