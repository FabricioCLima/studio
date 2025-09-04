
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
import { Skeleton } from '@/components/ui/skeleton';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, permissions } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <div className="flex w-full">
            <Skeleton className="hidden h-full w-64 md:block" />
            <div className="flex-1 space-y-4 p-4">
                <Skeleton className="h-12 w-1/2" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
      </div>
    );
  }
  
  if (!loading && user && permissions.length === 0) {
      return (
         <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
            <h1 className="text-2xl font-bold">Acesso Negado</h1>
            <p className="text-muted-foreground">Você não tem permissão para acessar este sistema.</p>
        </div>
      )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        {user && children}
      </SidebarInset>
    </SidebarProvider>
  );
}
