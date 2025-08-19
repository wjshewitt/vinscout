
'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, Send, Paperclip, MoreVertical, Car } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

// Dummy data for conversations and messages
const conversations: any[] = [];
const messagesData: any = {};


export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const { user } = useAuth();
  
  const handleSelectConversation = (conversation: (typeof conversations)[0]) => {
    setSelectedConversation(conversation);
  };
  
  const messages = selectedConversation ? messagesData[selectedConversation.id as keyof typeof messagesData] || [] : [];

  if (conversations.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center">
            <MessageSquare size={48} className="text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold">No Messages Yet</h2>
            <p className="text-muted-foreground">Your conversations will appear here.</p>
        </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex text-foreground">
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-10 bg-background" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => handleSelectConversation(convo)}
              className={cn(
                'flex items-center gap-4 w-full text-left px-4 py-3 hover:bg-accent transition-colors duration-200',
                selectedConversation.id === convo.id && 'bg-accent'
              )}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={convo.avatar} alt={convo.name} data-ai-hint="person face"/>
                <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                {convo.online && <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-card" />}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-foreground text-base font-medium truncate">{convo.name}</p>
                  <p className="text-muted-foreground text-xs">{convo.timestamp}</p>
                </div>
                <div className="flex justify-between items-start">
                  <p className="text-muted-foreground text-sm truncate mt-1">{convo.lastMessage}</p>
                   {convo.unread > 0 && <span className="flex items-center justify-center text-xs text-primary-foreground bg-primary rounded-full h-5 w-5 mt-1">{convo.unread}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-background">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">{selectedConversation.name}</h2>
            <div className="flex items-center gap-2">
                <Car className="text-muted-foreground" size={16} />
                <p className="text-sm text-muted-foreground">Regarding: {selectedConversation.vehicle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <MoreVertical className="text-muted-foreground" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-end gap-3 max-w-lg',
                message.sender === 'You' && 'justify-end ml-auto'
              )}
            >
              {message.sender !== 'You' && (
                <Avatar className="w-10 h-10">
                   <AvatarImage src={message.avatar} alt={message.sender} data-ai-hint="person face"/>
                   <AvatarFallback>{message.sender.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'rounded-lg p-3',
                  message.sender === 'You' ? 'bg-primary text-primary-foreground' : 'bg-card'
                )}
              >
                <p className={cn("text-sm font-medium mb-1", message.sender === 'You' ? 'text-blue-200' : 'text-muted-foreground')}>{message.sender}</p>
                <p className="text-base text-foreground">{message.text}</p>
              </div>
               {message.sender === 'You' && user && (
                <Avatar className="w-10 h-10">
                   <AvatarImage src={user.photoURL || 'https://placehold.co/100x100.png'} alt={user.displayName || 'You'} data-ai-hint="person face" />
                   <AvatarFallback>{user.displayName?.charAt(0) || 'Y'}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 bg-background border-t border-border">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
                <Paperclip className="text-muted-foreground" />
            </Button>
            <Input
              className="flex-1 rounded-full py-3 px-6 focus:ring-2 focus:ring-primary"
              placeholder="Type a message..."
            />
            <Button className="rounded-full p-3" size="icon">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
