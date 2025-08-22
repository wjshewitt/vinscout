
import { getAllUsers, UserProfile } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

async function CommunityPage() {
  const users = await getAllUsers();

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter mb-4">Community Directory</h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Browse the members of the VINscout community. Every member plays a part in keeping our roads safe.
        </p>
      </div>

      {users.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {users.map((user) => (
            <Link key={user.uid} href={`/profile/${user.uid}`}>
              <Card className="text-center hover:border-primary transition-colors h-full">
                <CardContent className="p-6 flex flex-col items-center">
                  <Avatar className="w-24 h-24 mb-4 border-4 border-transparent group-hover:border-primary/20">
                    <AvatarImage src={user.photoURL} alt={user.displayName} data-ai-hint="person face" />
                    <AvatarFallback className="text-3xl">
                      {user.displayName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg">{user.displayName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No community members found yet.</p>
        </div>
      )}
    </div>
  );
}

export default CommunityPage;
