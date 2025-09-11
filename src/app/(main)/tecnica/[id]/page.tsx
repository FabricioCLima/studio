
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Service } from '@/app/(main)/engenharia/page';
import { useAuth } from '@/context/auth-context';
import { FichaVisitaForm } from '@/components/ficha-visita-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FichaVisitaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const id = params.id;
    if (!user || !id) {
      setLoading(false);
      return;
    }

    const serviceId = id;
    const serviceRef = doc(db, 'servicos', serviceId);

    const unsubscribe = onSnapshot(serviceRef, (doc) => {
      if (doc.exists()) {
        setService({ id: doc.id, ...doc.data() } as Service);
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
  }, [user, params]);

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

  if (!service) {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
             <Button variant="outline" onClick={() => router.push('/tecnica')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Técnica
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
        <Button variant="outline" onClick={() => router.push('/tecnica')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
        </Button>
      </div>
      <FichaVisitaForm 
        service={service} 
        onSave={() => router.push('/tecnica')} 
      />
    </div>
  );
}
