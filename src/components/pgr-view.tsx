
'use client';

import type { FichaPGR, Service } from '@/app/(main)/engenharia/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Pencil, PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PgrForm } from './pgr-form';

interface PgrViewProps {
    serviceId: string;
    onBack: () => void;
}

export function PgrView({ serviceId, onBack }: PgrViewProps) {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingFicha, setEditingFicha] = useState<{ ficha: FichaPGR; index: number } | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user || !serviceId) {
      setLoading(false);
      return;
    }

    const serviceRef = doc(db, 'servicos', serviceId);
    const unsubscribe = onSnapshot(serviceRef, (doc) => {
      if (doc.exists()) {
        const serviceData = { id: doc.id, ...doc.data() } as Service;
        if (!Array.isArray(serviceData.fichasPGR)) {
          serviceData.fichasPGR = [];
        }
        setService(serviceData);
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
  }, [user, serviceId]);


  const handleEdit = (ficha: FichaPGR, index: number) => {
    setEditingFicha({ ficha, index });
    setIsCreatingNew(false);
  };
  
  const handleAddNew = () => {
    setIsCreatingNew(true);
    setEditingFicha(null);
  }

  const handleCancelForm = () => {
      setIsCreatingNew(false);
      setEditingFicha(null);
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-8 w-1/4" />
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
        <Button variant="outline" onClick={onBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
        </Button>
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>Serviço não encontrado.</p>
            </CardContent>
        </Card>
      </div>
     )
  }
  
  const sortedFichas = service.fichasPGR 
    ? [...service.fichasPGR].sort((a, b) => b.dataPreenchimento.seconds - a.dataPreenchimento.seconds) 
    : [];
  
  const showForm = isCreatingNew || editingFicha;

  return (
    <>
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para lista
        </Button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight">Fichas de PGR</h1>
                <p className="text-muted-foreground">
                    Empresa: <span className="font-semibold">{service.nomeEmpresa}</span>
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleAddNew} variant="default" disabled={showForm}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Nova Ficha PGR
                </Button>
            </div>
        </div>

        {showForm && (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>{editingFicha ? 'Editar Ficha PGR' : 'Nova Ficha de Vistoria de Riscos (PGR)'}</CardTitle>
                    <CardDescription>{editingFicha ? 'Altere os detalhes da vistoria abaixo.' : 'Preencha os detalhes da vistoria de riscos.'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <PgrForm 
                        service={service} 
                        onSave={handleCancelForm}
                        onCancel={handleCancelForm}
                        fichaToEdit={editingFicha?.ficha}
                        fichaIndex={editingFicha?.index}
                    />
                </CardContent>
            </Card>
        )}

        <Separator className="my-6" />

        <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Histórico de Fichas PGR</h2>
            {sortedFichas.length > 0 ? (
                sortedFichas.map((ficha, index) => {
                  const originalIndex = service.fichasPGR?.findIndex(f => f.dataPreenchimento.seconds === ficha.dataPreenchimento.seconds) ?? -1;
                  return (
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center text-lg">
                                <span>
                                    Vistoria <span className="font-semibold">{ficha.numeroVistoria}</span> em <span className="font-semibold">{ficha.setor}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {format(new Date(ficha.dataPreenchimento.seconds * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(ficha, originalIndex)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div>
                                <h4 className="font-semibold mb-2">Detalhes da Vistoria:</h4>
                               <p className="text-sm"><span className="font-medium">Responsável:</span> {ficha.responsavelVistoria}</p>
                               <p className="text-sm"><span className="font-medium">Atividade:</span> {ficha.atividade}</p>
                           </div>
                           {ficha.planoAcao && ficha.planoAcao.length > 0 && (
                             <div>
                                <h4 className="font-semibold mb-2 mt-4">Não Conformidades (Plano de Ação):</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {ficha.planoAcao.map((nc, i) => (
                                        <li key={i} className="text-sm">{nc.descricaoNaoConformidade}</li>
                                    ))}
                                </ul>
                            </div>
                           )}
                        </CardContent>
                    </Card>
                  )
                })
            ) : (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <p>Nenhuma ficha PGR registrada para este serviço.</p>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </>
  );
}
