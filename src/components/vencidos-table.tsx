
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Service } from '@/app/(main)/engenharia/page';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from './ui/card';
import { StatusBadge } from './status-badge';
import { Button } from './ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { EditCadastroDialog } from './edit-cadastro-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { deleteDoc, doc } from 'firebase/firestore';

interface VencidosTableProps {
  services: Service[];
}

export function VencidosTable({ services }: VencidosTableProps) {
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const { toast } = useToast();

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

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Nenhum serviço vencido encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Ações</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="hidden md:table-cell">Responsável</TableHead>
              <TableHead className="hidden sm:table-cell">Data Cadastro</TableHead>
              <TableHead className="hidden md:table-cell">Data Vencimento</TableHead>
              <TableHead>Status</TableHead>
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
                      <DropdownMenuSeparator />
                       <DropdownMenuItem
                        onClick={() => setEditingService(service)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Renovar/Editar
                      </DropdownMenuItem>
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
                <TableCell className="font-medium">{service.nomeEmpresa}</TableCell>
                <TableCell className="hidden md:table-cell">{service.responsavel || '-'}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {service.dataServico
                    ? format(new Date(service.dataServico.seconds * 1000), 'dd/MM/yyyy', { locale: ptBR })
                    : '-'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {service.dataVencimento
                    ? format(new Date(service.dataVencimento.seconds * 1000), 'dd/MM/yyyy', { locale: ptBR })
                    : '-'}
                </TableCell>
                <TableCell>
                  <StatusBadge service={service} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
        {editingService && (
            <EditCadastroDialog
            service={editingService}
            open={!!editingService}
            onOpenChange={(open) => {
                if (!open) {
                setEditingService(null);
                }
            }}
            />
        )}

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
    </>
  );
}
