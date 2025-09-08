
'use client';

import type { FichaVisita, Service } from '@/app/(main)/engenharia/page';
import { FichaVisitaForm } from '@/components/ficha-visita-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, CheckCircle2, FileText, Pencil, PlusCircle, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface FichaVisitaViewProps {
    serviceId: string;
    onBack: () => void;
    onSwitchToPgr: () => void;
    onSwitchToLtcat: () => void;
}

export function FichaVisitaView({ serviceId, onBack, onSwitchToPgr, onSwitchToLtcat }: FichaVisitaViewProps) {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingFicha, setEditingFicha] = useState<{ ficha: FichaVisita; index: number } | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!user || !serviceId) {
      setLoading(false);
      return;
    }

    const serviceRef = doc(db, 'servicos', serviceId);
    const unsubscribe = onSnapshot(serviceRef, (doc) => {
      if (doc.exists()) {
        const serviceData = { id: doc.id, ...doc.data() } as Service;
        // Ensure fichasVisita is an array
        if (!Array.isArray(serviceData.fichasVisita)) {
          serviceData.fichasVisita = [];
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

  const handleFinishVisit = async () => {
    if (!service) return;
    try {
        const serviceRef = doc(db, 'servicos', service.id);
        await updateDoc(serviceRef, { status: 'digitacao' });
        toast({
            title: 'Sucesso!',
            description: 'Serviço enviado para a Digitação.',
            className: 'bg-accent text-accent-foreground',
        });
        onBack();
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro!',
            description: 'Não foi possível finalizar a visita.',
        });
    } finally {
        setIsConfirmingFinish(false);
    }
  }

  const handleEdit = (ficha: FichaVisita, index: number) => {
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
  
  const sortedFichas = service.fichasVisita 
    ? [...service.fichasVisita].sort((a, b) => b.dataPreenchimento.seconds - a.dataPreenchimento.seconds) 
    : [];
  
  const showForm = isCreatingNew || editingFicha;
  const canFinish = (service.status === 'aguardando_visita' || service.status === 'em_visita') && sortedFichas.length > 0;

  return (
    <>
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Técnica
        </Button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight">Fichas de Visita</h1>
                <p className="text-muted-foreground">
                    Empresa: <span className="font-semibold">{service.nomeEmpresa}</span>
                </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button onClick={onSwitchToLtcat} variant="secondary">
                  <FileText className="mr-2 h-4 w-4" />
                  Gerenciar Fichas LTCAT
                </Button>
                <Button onClick={handleAddNew} variant="default" disabled={showForm}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Nova Ficha
                </Button>
                {canFinish && (
                    <Button onClick={() => setIsConfirmingFinish(true)} className="bg-accent hover:bg-accent/90">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Finalizar e Enviar p/ Digitação
                    </Button>
                )}
            </div>
        </div>

        {showForm && (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>{editingFicha ? 'Editar Ficha de Inspeção' : 'Nova Ficha de Inspeção'}</CardTitle>
                    <CardDescription>{editingFicha ? 'Altere os detalhes da inspeção abaixo.' : 'Preencha os detalhes da inspeção de segurança.'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <FichaVisitaForm 
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
            <h2 className="text-2xl font-bold tracking-tight">Histórico de Fichas</h2>
            {sortedFichas.length > 0 ? (
                sortedFichas.map((ficha, index) => {
                  // The sortedFichas is reversed, so we need to find the original index
                  const originalIndex = service.fichasVisita.findIndex(f => f.dataPreenchimento.seconds === ficha.dataPreenchimento.seconds);
                  return (
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center text-lg">
                                <span>
                                    Visita realizada por: <span className="font-semibold">{ficha.tecnico || 'Não informado'}</span>
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
                                <h4 className="font-semibold mb-2">Detalhes da Inspeção:</h4>
                               <p className="text-sm"><span className="font-medium">Setor:</span> {ficha.setorInspecionado}</p>
                               <p className="text-sm"><span className="font-medium">Acompanhante:</span> {ficha.acompanhante}</p>
                           </div>
                           {ficha.naoConformidades && ficha.naoConformidades.length > 0 && (
                             <div>
                                <h4 className="font-semibold mb-2 mt-4">Não Conformidades:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {ficha.naoConformidades.map((nc, i) => (
                                        <li key={i} className="text-sm">{nc.descricao}</li>
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
                        <p>Nenhuma ficha de visita registrada para este serviço.</p>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
      <AlertDialog open={isConfirmingFinish} onOpenChange={setIsConfirmingFinish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Finalização</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar a visita para a empresa <span className="font-bold">{service?.nomeEmpresa}</span> e enviar para a Digitação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinishVisit} className="bg-accent hover:bg-accent/90">Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
