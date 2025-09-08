
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { CheckCircle2, MoreHorizontal, PlayCircle, Printer, Trash2, ClipboardList, Undo2, FileText } from 'lucide-react';
import type { Service } from '@/app/(main)/engenharia/page';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from './ui/card';
import { StatusBadge } from './status-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { PrintDialog } from './print-dialog';

interface TecnicaTableProps {
  services: Service[];
  onSelectService: (service: Service, mode: 'ficha_visita' | 'pgr' | 'ltcat') => void;
}

export function TecnicaTable({ services, onSelectService }: TecnicaTableProps) {
    const { toast } = useToast();
    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
    const [printingService, setPrintingService] = useState<Service | null>(null);
    const [confirmAction, setConfirmAction] = useState<{service: Service, status: 'digitacao' | 'avaliacao'} | null>(null);


    const handleUpdateStatus = async (id: string, newStatus: string) => {
        const descriptions = {
            em_visita: 'Status do serviço atualizado para "Em Visita".',
            digitacao: 'Serviço enviado para a Digitação.',
            avaliacao: 'Serviço enviado para avaliação na Engenharia.'
        }
        try {
            const serviceRef = doc(db, "servicos", id);
            await updateDoc(serviceRef, { status: newStatus });
            toast({
                title: 'Sucesso!',
                description: descriptions[newStatus as keyof typeof descriptions] || 'Status atualizado.',
                className: 'bg-accent text-accent-foreground',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro!',
                description: 'Não foi possível atualizar o status do serviço.',
            });
        } finally {
            setConfirmAction(null);
        }
    }
    
    const handleDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, "servicos", id));
            toast({
                title: 'Sucesso!',
                description: 'Serviço excluído com sucesso.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro!',
                description: 'Não foi possível excluir o serviço.',
            });
        } finally {
            setServiceToDelete(null);
        }
    }
    
    const getConfirmationDialogDescription = () => {
        if (!confirmAction) return '';
        if (confirmAction.status === 'digitacao') {
            return `Tem certeza que deseja concluir a visita e enviar o serviço da empresa ${confirmAction.service.nomeEmpresa} para a Digitação?`;
        }
        if (confirmAction.status === 'avaliacao') {
             return `Tem certeza que deseja enviar o serviço da empresa ${confirmAction.service.nomeEmpresa} para avaliação na Engenharia?`;
        }
        return '';
    }

  if (services.length === 0) {
    return (
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>Nenhum serviço aguardando visita técnica.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <>
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Ações</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="hidden lg:table-cell">Contato</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Técnico</TableHead>
              <TableHead className="hidden lg:table-cell">Agendamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                           <DropdownMenuItem onClick={() => setPrintingService(service)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Imprimir Ficha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem onClick={() => onSelectService(service, 'pgr')}>
                                <ClipboardList className="mr-2 h-4 w-4" />
                                Gerenciar Fichas PGR
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSelectService(service, 'ltcat')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Gerenciar Fichas LTCAT
                          </DropdownMenuItem>
                          <DropdownMenuItem
                              onClick={() => handleUpdateStatus(service.id, 'em_visita')}
                              disabled={service.status === 'em_visita' || service.status === 'digitacao'}
                          >
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Iniciar Visita
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                              onClick={() => setConfirmAction({ service, status: 'avaliacao' })}
                              disabled={service.status !== 'em_visita'}
                          >
                              <Undo2 className="mr-2 h-4 w-4" />
                              Enviar p/ Engenharia
                          </DropdownMenuItem>
                          <DropdownMenuItem
                              onClick={() => setConfirmAction({ service, status: 'digitacao' })}
                              disabled={service.status !== 'em_visita'}
                          >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Enviar p/ Digitação
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem 
                              onClick={() => setServiceToDelete(service.id)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="font-medium">{service.nomeEmpresa}</TableCell>
                <TableCell className="hidden lg:table-cell">{service.contato}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <StatusBadge service={service} />
                </TableCell>
                <TableCell className="hidden md:table-cell">{service.tecnico || '-'}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  {service.dataAgendamento ? format(new Date(service.dataAgendamento.seconds * 1000), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </Card>
      
      <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o serviço.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => serviceToDelete && handleDelete(serviceToDelete)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
              <AlertDialogDescription>
                  {getConfirmationDialogDescription()}
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => confirmAction && handleUpdateStatus(confirmAction.service.id, confirmAction.status)} className="bg-accent hover:bg-accent/90">Confirmar</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      {printingService && (
        <PrintDialog
          service={printingService}
          open={!!printingService}
          onOpenChange={(open) => {
            if (!open) {
              setPrintingService(null);
            }
          }}
        />
      )}
      </>
  );
}
