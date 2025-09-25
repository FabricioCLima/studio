
'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { TecnicoDialog } from '@/components/tecnico-dialog';
import { TecnicosTable } from '@/components/tecnicos-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export type Tecnico = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
};

export default function TecnicosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, permissions, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user || !permissions.includes('admin')) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'tecnicos'));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const tecnicosData: Tecnico[] = [];
        querySnapshot.forEach((doc) => {
          tecnicosData.push({ id: doc.id, ...doc.data() } as Tecnico);
        });
        setTecnicos(tecnicosData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching tecnicos:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, permissions, authLoading]);
  
  if (authLoading || loading) {
     return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Técnicos
            </h1>
          </div>
            <div className="space-y-4 pt-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
        </div>
     )
  }

  if (!permissions.includes('admin')) {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
             <Card className="mt-4 border-destructive">
                <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-destructive'><ShieldAlert />Acesso Negado</CardTitle>
                    <CardDescription className='text-destructive'>Você não tem permissão para gerenciar técnicos.</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p>Esta área é restrita a administradores.</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Técnicos
          </h1>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Cadastrar Técnico
          </Button>
        </div>
        
        <TecnicosTable tecnicos={tecnicos} />

      </div>
      <TecnicoDialog 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onSave={() => setIsModalOpen(false)}
      />
    </>
  );
}
