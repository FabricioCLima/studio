
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Button } from './ui/button';
import { CheckCircle2, MoreHorizontal, Pencil, Printer, Trash2 } from 'lucide-react';
import type { Service } from '@/app/(main)/engenharia/page';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from './ui/card';
import { useState } from 'react';
import { EditServiceDialog } from './edit-service-dialog';
import { StatusBadge } from './status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { PrintDialog } from './print-dialog';
import { AssignResponsavelDialog } from './assign-responsavel-dialog';

interface EngenhariaTableProps {
  services: Service[];
}

export function EngenhariaTable({ services }: EngenhariaTableProps) {
  const { toast } = useToast();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [printingService, setPrintingService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [serviceToDischarge, setServiceToDischarge] = useState<Service | null>(null);
  const [assigningResponsavelService, setAssigningResponsavelService] = useState<Service | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'servicos', id));
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
  };

  const handleDischarge = async (id: string) => {
    try {
        const serviceRef = doc(db, 'servicos', id);
        await updateDoc(serviceRef, { status: 'arquivado' });
        toast({
            title: 'Sucesso!',
            description: 'Serviço arquivado com sucesso.',
            className: 'bg-accent text-accent-foreground',
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro!',
            description: 'Não foi possível arquivar o serviço.',
        });
    } finally {
        setServiceToDischarge(null);
    }
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Nenhum serviço pendente na engenharia.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="hidden md:table-cell">Responsável</TableHead>
                <TableHead className="hidden lg:table-cell">Contato</TableHead>
                <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Técnico</TableHead>
                <TableHead className="hidden md:table-cell">Agendamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.nomeEmpresa}</TableCell>
                  <TableCell className="hidden md:table-cell">{service.responsavel || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell">{service.contato}</TableCell>
                  <TableCell className="hidden lg:table-cell">{service.telefone}</TableCell>
                  <TableCell>
                    <StatusBadge service={service} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{service.tecnico || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {service.dataAgendamento
                      ? format(new Date(service.dataAgendamento.seconds * 1000), 'dd/MM/yyyy', { locale: ptBR })
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setAssigningResponsavelService(service)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Atribuir Responsável
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingService(service)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar Agendamento
                        </DropdownMenuItem>
                         {service.status === 'concluido' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setServiceToDischarge(service)}>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Dar Baixa
                              </DropdownMenuItem>
                            </>
                         )}
                        <DropdownMenuSeparator />
                         <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => setServiceToDelete(service.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            <AlertDialogAction onClick={() => serviceToDelete && handleDelete(serviceToDelete)} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!serviceToDischarge} onOpenChange={(open) => !open && setServiceToDischarge(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Baixa de Serviço</AlertDialogTitle>
            <AlertDialogDescription>
                Tem certeza que deseja dar baixa no serviço da empresa <span className="font-bold">{serviceToDischarge?.nomeEmpresa}</span>? Esta ação moverá o serviço para o Arquivo Morto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => serviceToDischarge && handleDischarge(serviceToDischarge.id)} className="bg-accent hover:bg-accent/90">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editingService && (
        <EditServiceDialog
          service={editingService}
          open={!!editingService}
          onOpenChange={(open) => {
            if (!open) {
              setEditingService(null);
            }
          }}
        />
      )}
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
      {assigningResponsavelService && (
        <AssignResponsavelDialog
            open={!!assigningResponsavelService}
            onOpenChange={(open) => !open && setAssigningResponsavelService(null)}
            service={assigningResponsavelService}
            onSuccess={() => setAssigningResponsavelService(null)}
        />
      )}
    </>
  );
}
