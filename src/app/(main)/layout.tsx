
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
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

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

  if (!user) {
      return null;
  }
  
  if (permissions.length === 0) {
      return (
          <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
              <div className="text-center">
                  <h1 className="text-2xl font-bold">Acesso Negado</h1>
                  <p className="text-muted-foreground">Você não tem permissão para acessar este sistema.</p>
                   <p className="text-muted-foreground mt-2 text-sm">
                        Seu email: <span className="font-semibold">{user.email}</span>
                   </p>
                  <Button variant="outline" className="mt-4" onClick={() => auth.signOut()}>
                      Fazer login com outra conta
                  </Button>
              </div>
          </div>
      )
  }


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
