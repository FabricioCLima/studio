
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/sidebar-nav';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, permissions } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Verificando acesso...</span>
        </div>
      </div>
    );
  }

  // User is loaded, but is not logged in, redirect will happen.
  if (!user) {
    return null;
  }
  
  // User is logged in, but has no permissions at all.
  if (permissions.length === 0) {
      return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-center">
                <div className="rounded-lg border bg-card p-8 shadow-sm">
                    <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
                    <p className="mt-2 text-muted-foreground">
                        Você não tem permissão para acessar esta área.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                         Seu email: <span className="font-semibold">{user.email}</span>
                    </p>
                   <Button variant="outline" className="mt-4" onClick={() => auth.signOut()}>
                       Fazer login com outra conta
                   </Button>
               </div>
           </div>
      )
  }
  
  // If the user is authenticated and has permissions, render the app layout.
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
