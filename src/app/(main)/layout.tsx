
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

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, permissions } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se o carregamento terminou e não há usuário, redireciona para o login.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Durante o carregamento, exibe uma tela de espera.
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
  
  // Se o carregamento terminou, mas o usuário não está logado, retorna null 
  // enquanto o useEffect redireciona. Isso evita renderizações indesejadas.
  if (!user) {
    return null;
  }

  // Se o usuário está logado mas não tem permissões, exibe "Acesso Negado".
  // Isso só acontece depois que o 'loading' é 'false'.
  if (permissions.length === 0) {
      return (
         <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
            <h1 className="text-2xl font-bold">Acesso Negado</h1>
            <p className="text-muted-foreground">Você não tem permissão para acessar este sistema.</p>
        </div>
      )
  }

  // Se o usuário está logado e possui permissões, renderiza o layout principal.
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
