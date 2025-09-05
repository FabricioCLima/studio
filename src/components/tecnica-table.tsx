
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
import { CheckCircle2, MoreHorizontal, PlayCircle, Printer, Trash2, ClipboardList } from 'lucide-react';
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
import Link from 'next/link';

interface TecnicaTableProps {
  services: Service[];
}

export function TecnicaTable({ services }: TecnicaTableProps) {
    const { toast } = useToast();
    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
    const [printingService, setPrintingService] = useState<Service | null>(null);


    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const serviceRef = doc(db, "servicos", id);
            await updateDoc(serviceRef, { status: newStatus });
            toast({
                title: 'Sucesso!',
                description: 'Status do serviço atualizado.',
                className: 'bg-accent text-accent-foreground',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro!',
                description: 'Não foi possível atualizar o status do serviço.',
            });
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
                           <DropdownMenuItem asChild>
                               <Link href={`/ficha-visita/${service.id}`} target="_blank">
                                <ClipboardList className="mr-2 h-4 w-4" />
                                Ficha de Visita
                               </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                              onClick={() => handleUpdateStatus(service.id, 'em_visita')}
                              disabled={service.status === 'em_visita' || service.status === 'concluido'}
                          >
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Iniciar Visita
                          </DropdownMenuItem>
                          <DropdownMenuItem
                              onClick={() => handleUpdateStatus(service.id, 'digitacao')}
                              disabled={service.status !== 'em_visita'}
                          >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Concluir Serviço
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
