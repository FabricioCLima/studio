
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Service } from '@/app/(main)/engenharia/page';
import { useAuth } from '@/context/auth-context';
import { FichaVisitaForm } from '@/components/ficha-visita-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FichaVisitaPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const { user, permissions } = useAuth();

  useEffect(() => {
    if (!user || !id) {
      setLoading(false);
      return;
    }

    const serviceRef = doc(db, 'servicos', id);

    const unsubscribe = onSnapshot(serviceRef, (doc) => {
      if (doc.exists()) {
        const serviceData = { id: doc.id, ...doc.data() } as Service;
        
        // Security Check: Does the user have permission to view this service?
        const isAdmin = permissions.includes('admin');
        const isTecnicoAssigned = serviceData.tecnico === user.displayName;
        const hasTecnicaPermission = permissions.includes('tecnica');

        if (isAdmin || (hasTecnicaPermission && isTecnicoAssigned)) {
            setService(serviceData);
            setHasPermission(true);
        } else {
            setService(null);
            setHasPermission(false);
        }
      } else {
        console.error('No such document!');
        setService(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching service:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, id, permissions]);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-4 pt-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!hasPermission && !loading) {
     return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
             <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>
            <Card className="mt-4 border-destructive">
                <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-destructive'><ShieldAlert />Acesso Negado</CardTitle>
                    <CardDescription className='text-destructive'>Você não tem permissão para visualizar esta ficha de visita.</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p>Verifique se você é o técnico designado para este serviço ou entre em contato com um administrador.</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!service) {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
             <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>
            <Card className="mt-4">
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>Serviço não encontrado.</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Ficha de Visita Técnica</h1>
            <p className="text-muted-foreground">
                Editando informações para a empresa: <span className="font-semibold">{service.nomeEmpresa}</span>
            </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
        </Button>
      </div>
      <FichaVisitaForm 
        service={service} 
        onSave={() => router.back()} 
      />
    </div>
  );
}
