
'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, Send, Paperclip, MoreVertical, Car, MessageSquare, Loader2, Trash2, ShieldBan, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { listenToConversations, Conversation, listenToMessages, Message, sendMessage, deleteConversation, blockUser, unblockUser, checkIfUserIsBlocked } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPageActive, setIsPageActive] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageActive(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  useEffect(() => {
    if (user) {
      setLoading(true);
      const unsubscribe = listenToConversations(user.uid, (loadedConversations) => {
        setConversations(loadedConversations);
        
        const urlConvoId = searchParams.get('conversationId');
        if (urlConvoId) {
            const convoToSelect = loadedConversations.find(c => c.id === urlConvoId);
            if(convoToSelect) {
                setSelectedConversation(convoToSelect);
            }
        } else if (!selectedConversation && loadedConversations.length > 0) {
          setSelectedConversation(loadedConversations[0]);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, searchParams]);

  useEffect(() => {
    if (selectedConversation && user) {
      const otherParticipantId = selectedConversation.participants.find(p => p !== user.uid);
      if (otherParticipantId) {
        checkIfUserIsBlocked(user.uid, otherParticipantId).then(setIsBlocked);
      }
      const unsubscribe = listenToMessages(selectedConversation.id, setMessages, user.uid, isPageActive);
      return () => unsubscribe();
    }
  }, [selectedConversation, user, isPageActive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || isBlocked) return;
    const isRecipientBlocked = await checkIfUserIsBlocked(selectedConversation.participants.find(p => p !== user.uid)!, user.uid);
    if(isRecipientBlocked) {
        toast({
            variant: "destructive",
            title: "Cannot send message",
            description: "This user has blocked you.",
        });
        return;
    }
    
    await sendMessage(selectedConversation.id, newMessage, user, "Question");
    setNewMessage('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  const handleDeleteConversation = async () => {
    if (!selectedConversation || !user) return;
    try {
        await deleteConversation(selectedConversation.id, user.uid);
        toast({
            title: "Conversation Deleted",
            description: "The conversation has been removed from your inbox.",
        });
        setSelectedConversation(null);
        setShowDeleteDialog(false);
    } catch (error) {
        console.error("Error deleting conversation: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to delete conversation.',
        });
    }
  };

  const handleBlockUser = async () => {
    if (!selectedConversation || !user) return;
    const otherParticipantId = selectedConversation.participants.find(p => p !== user.uid);
    if (!otherParticipantId) return;

    try {
        if(isBlocked) {
            await unblockUser(user.uid, otherParticipantId);
            toast({
                title: "User Unblocked",
                description: "You can now send and receive messages from this user.",
            });
            setIsBlocked(false);
        } else {
            await blockUser(user.uid, otherParticipantId);
            toast({
                title: "User Blocked",
                description: "You will no longer receive messages from this user.",
            });
            setIsBlocked(true);
        }
        setShowBlockDialog(false);
    } catch (error) {
         console.error("Error blocking/unblocking user: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not complete the action. Please try again.',
        });
    }
  };

  if (loading || authLoading) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );
  }

  if (conversations.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-4">
            <MessageSquare size={48} className="text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold">No Messages Yet</h2>
            <p className="text-muted-foreground">When you contact a vehicle owner, your conversation will appear here.</p>
        </div>
    );
  }

  return (
    <>
    <div className="h-[calc(100vh-4rem)] flex text-foreground">
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-10 bg-background" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((convo) => {
            const otherParticipantId = convo.participants.find(p => p !== user?.uid);
            const otherParticipant = otherParticipantId ? convo.participantDetails[otherParticipantId] : { name: 'Unknown', avatar: ''};
            const unreadCount = user && convo.unread ? convo.unread[user.uid] || 0 : 0;
            
            return (
                <button
                key={convo.id}
                onClick={() => setSelectedConversation(convo)}
                className={cn(
                    'flex items-center gap-4 w-full text-left px-4 py-3 hover:bg-accent transition-colors duration-200',
                    selectedConversation?.id === convo.id && 'bg-accent'
                )}
                >
                <Avatar className="h-12 w-12">
                    <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.name} data-ai-hint="person face"/>
                    <AvatarFallback>{otherParticipant?.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                    <p className="text-foreground text-base font-medium truncate">{otherParticipant?.name}</p>
                    {convo.lastMessageAt && <p className="text-muted-foreground text-xs">{formatDistanceToNow(new Date(convo.lastMessageAt), { addSuffix: true })}</p>}
                    </div>
                    <div className="flex justify-between items-start">
                    <p className="text-muted-foreground text-sm truncate mt-1">{convo.lastMessage}</p>
                     {unreadCount > 0 && (
                        <span className="flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 ml-2">
                            {unreadCount}
                        </span>
                    )}
                    </div>
                </div>
                </button>
            )
          })}
        </div>
      </div>
       {selectedConversation && user && (
            <div className="flex-1 flex flex-col bg-background">
                <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                    <h2 className="text-xl font-bold">{selectedConversation.participantDetails[selectedConversation.participants.find(p => p !== user.uid) as string]?.name}</h2>
                    <div className="flex items-center gap-2">
                        <Car className="text-muted-foreground" size={16} />
                        <p className="text-sm text-muted-foreground">Regarding: {selectedConversation.vehicleSummary}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Conversation</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onSelect={() => setShowBlockDialog(true)}>
                                <ShieldBan className="mr-2 h-4 w-4" />
                                <span>{isBlocked ? 'Unblock' : 'Block'} User</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((message) => {
                    const isYou = message.senderId === user.uid;
                    const senderDetails = selectedConversation.participantDetails[message.senderId];
                    return (
                        <div
                        key={message.id}
                        className={cn(
                            'flex items-end gap-3 max-w-lg',
                            isYou && 'justify-end ml-auto'
                        )}
                        >
                        {!isYou && (
                            <Avatar className="w-10 h-10">
                            <AvatarImage src={senderDetails?.avatar} alt={senderDetails?.name} data-ai-hint="person face"/>
                            <AvatarFallback>{senderDetails?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <div
                            className={cn(
                            'rounded-lg p-3',
                            isYou ? 'bg-primary text-primary-foreground' : 'bg-card'
                            )}
                        >
                            <p className={cn("text-sm font-medium mb-1", isYou ? 'text-primary-foreground/80' : 'text-primary')}>{senderDetails?.name}</p>
                            
                            {message.messageType === 'Sighting' && message.sightingLocation && (
                                <div className="mb-2 p-2 bg-black/20 rounded-md">
                                    <p className="font-bold text-sm">Sighting Reported:</p>
                                    <div className="flex items-center gap-2 text-xs mt-1">
                                        <MapPin size={12} />
                                        <span>{message.sightingLocation.address}</span>
                                    </div>
                                </div>
                            )}

                            <p className="text-base">{message.text}</p>
                        </div>
                        {isYou && (
                            <Avatar className="w-10 h-10">
                            <AvatarImage src={user.photoURL || 'https://placehold.co/100x100.png'} alt={user.displayName || 'You'} data-ai-hint="person face" />
                            <AvatarFallback>{user.displayName?.charAt(0) || 'Y'}</AvatarFallback>
                            </Avatar>
                        )}
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-background border-t border-border">
                {isBlocked ? (
                    <div className="text-center text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                        You have blocked this user. Unblock them to send a message.
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon">
                            <Paperclip className="text-muted-foreground" />
                        </Button>
                        <Input
                        className="flex-1 rounded-full py-3 px-6 focus:ring-2 focus:ring-primary"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        />
                        <Button className="rounded-full p-3" size="icon" onClick={handleSendMessage}>
                        <Send className="h-5 w-5" />
                        </Button>
                    </div>
                )}
                </div>
            </div>
       )}
    </div>
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the conversation from your inbox. The other participant will still see the chat history. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
     <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{isBlocked ? 'Unblock' : 'Block'} this user?</AlertDialogTitle>
                <AlertDialogDescription>
                    {isBlocked ? 'Unblocking this user will allow you to send and receive messages again.' : 'Blocking this user will prevent them from sending you messages. You will not be able to message them either.'}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBlockUser} className={cn(isBlocked && 'bg-primary hover:bg-primary/90')}>{isBlocked ? 'Unblock' : 'Block'}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

    