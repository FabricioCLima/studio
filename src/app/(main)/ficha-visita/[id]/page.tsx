
'use client';

import type { Service } from '@/app/(main)/engenharia/page';
import { FichaVisitaForm } from '@/components/ficha-visita-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FichaVisitaPage() {
  const params = useParams();
  const id = params.id as string;
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user || !id) {
      setLoading(false);
      return;
    }

    const serviceRef = doc(db, 'servicos', id);
    const unsubscribe = onSnapshot(serviceRef, (doc) => {
      if (doc.exists()) {
        setService({ id: doc.id, ...doc.data() } as Service);
      } else {
        console.error("No such document!");
        setService(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching document:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, id]);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <div className="space-y-4 pt-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (!service) {
     return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>Serviço não encontrado.</p>
            </CardContent>
        </Card>
      </div>
     )
  }
  
  const sortedFichas = service.fichasVisita 
    ? [...service.fichasVisita].sort((a, b) => b.dataPreenchimento.seconds - a.dataPreenchimento.seconds) 
    : [];

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight">Fichas de Visita</h1>
                <p className="text-muted-foreground">
                    Empresa: <span className="font-semibold">{service.nomeEmpresa}</span>
                </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {showForm ? 'Cancelar Nova Ficha' : 'Adicionar Nova Ficha'}
            </Button>
        </div>

        {showForm && (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Nova Ficha de Visita</CardTitle>
                    <CardDescription>Preencha os detalhes da visita.</CardDescription>
                </CardHeader>
                <CardContent>
                    <FichaVisitaForm service={service} onSave={() => setShowForm(false)} />
                </CardContent>
            </Card>
        )}

        <Separator className="my-6" />

        <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Histórico de Fichas</h2>
            {sortedFichas.length > 0 ? (
                sortedFichas.map((ficha, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center text-lg">
                                <span>
                                    Visita realizada por: <span className="font-semibold">{ficha.tecnico || 'Não informado'}</span>
                                </span>
                                <span className="text-sm font-normal text-muted-foreground">
                                    {format(new Date(ficha.dataPreenchimento.seconds * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div>
                                <h4 className="font-semibold mb-2">Checklist:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {Object.entries(ficha.checklist).map(([key, value]) => (
                                        <li key={key} className={value ? 'text-primary' : 'text-muted-foreground'}>
                                            <span className="font-medium">{key.replace('item', 'Item ')}:</span> {value ? 'Verificado' : 'Não Verificado'}
                                        </li>
                                    ))}
                                </ul>
                           </div>
                           {ficha.observacoes && (
                             <div>
                                <h4 className="font-semibold mb-2">Observações:</h4>
                                <p className="text-muted-foreground whitespace-pre-wrap">{ficha.observacoes}</p>
                            </div>
                           )}
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <p>Nenhuma ficha de visita registrada para este serviço.</p>
                    </CardContent>
                </Card>
            )}
        </div>

      </div>
    </>
  );
}
