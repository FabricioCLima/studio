
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

  if (user && permissions.length === 0) {
     return (
       <div className="flex h-screen w-full flex-col items-center justify-center bg-secondary">
          <div className="text-center">
            <h1 className="text-4xl font-bold">Acesso Negado</h1>
            <p className="mt-2 text-muted-foreground">
                Você não tem permissão para acessar este sistema.
            </p>
             <p className="mt-1 text-sm text-muted-foreground">
                Seu email: <span className="font-semibold">{user.email}</span>
            </p>
            <button
                className="mt-6 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                onClick={() => auth.signOut()}
            >
                Fazer login com outra conta
            </button>
          </div>
       </div>
    );
  }

  if (!user) {
    return null;
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
