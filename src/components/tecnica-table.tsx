
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
import { CheckCircle2, MoreHorizontal, PlayCircle, Trash2, Upload } from 'lucide-react';
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
  AlertDialogTrigger,
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
import { UploadFilesDialog } from './upload-files-dialog';

interface TecnicaTableProps {
  services: Service[];
}

export function TecnicaTable({ services }: TecnicaTableProps) {
    const { toast } = useToast();
    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
    const [uploadingService, setUploadingService] = useState<Service | null>(null);


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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead className="text-center">Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Técnico</TableHead>
            <TableHead>Agendamento</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">{service.nomeEmpresa}</TableCell>
              <TableCell>{service.contato}</TableCell>
              <TableCell className="text-center">{service.email || '-'}</TableCell>
              <TableCell>{service.telefone}</TableCell>
              <TableCell>
                <StatusBadge service={service} />
              </TableCell>
              <TableCell>
                {service.dataServico ? format(new Date(service.dataServico.seconds * 1000), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
              </TableCell>
              <TableCell>{service.tecnico || '-'}</TableCell>
              <TableCell>
                {service.dataAgendamento ? format(new Date(service.dataAgendamento.seconds * 1000), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog open={serviceToDelete === service.id} onOpenChange={(open) => !open && setServiceToDelete(null)}>
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
                             <DropdownMenuItem onClick={() => setUploadingService(service)}>
                                <Upload className="mr-2 h-4 w-4" />
                                Adicionar Anexos
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
                            <AlertDialogTrigger asChild>
                                 <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o serviço.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setServiceToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => serviceToDelete && handleDelete(serviceToDelete)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Card>
      {uploadingService && (
        <UploadFilesDialog
            open={!!uploadingService}
            onOpenChange={(open) => !open && setUploadingService(null)}
            service={uploadingService}
            onSuccess={() => setUploadingService(null)}
        />
      )}
      </>
  );
}
