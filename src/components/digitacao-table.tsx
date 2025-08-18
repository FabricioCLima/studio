
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
import { CheckCircle2, Download, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Service } from '@/app/(main)/engenharia/page';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import { StatusBadge } from './status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AssignDigitadorDialog } from './assign-digitador-dialog';

interface DigitacaoTableProps {
  services: Service[];
}

export function DigitacaoTable({ services }: DigitacaoTableProps) {
    const { toast } = useToast();
    const [serviceToConclude, setServiceToConclude] = useState<Service | null>(null);
    const [assigningDigitadorService, setAssigningDigitadorService] = useState<Service | null>(null);

    const handleDownload = (anexo: {name: string, type: string, data: string}) => {
        try {
            const link = document.createElement('a');
            link.href = anexo.data;
            link.download = anexo.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro!',
                description: 'Não foi possível baixar o arquivo.',
            });
            console.error('Error downloading file:', error)
        }
    }

    const handleConclude = async (serviceId: string) => {
        try {
            const serviceRef = doc(db, 'servicos', serviceId);
            await updateDoc(serviceRef, {
                status: 'medicina'
            });
            toast({
                title: 'Sucesso!',
                description: 'Serviço enviado para a Medicina.',
                className: 'bg-accent text-accent-foreground',
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Erro!',
                description: 'Não foi possível concluir o serviço.',
            });
        } finally {
            setServiceToConclude(null);
        }
    }


  if (services.length === 0) {
    return (
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>Nenhum serviço aguardando na digitação.</p>
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
            <TableHead>Status</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Anexos</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">{service.nomeEmpresa}</TableCell>
              <TableCell>
                <StatusBadge service={service} />
              </TableCell>
               <TableCell>{service.digitador || '-'}</TableCell>
              <TableCell>
                {service.anexos && service.anexos.length > 0 ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Baixar Anexos ({service.anexos.length})
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {service.anexos.map((anexo, index) => (
                                <DropdownMenuItem key={index} onClick={() => handleDownload(anexo)}>
                                    {anexo.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    '-'
                )}
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
                      <DropdownMenuItem onClick={() => setAssigningDigitadorService(service)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Atribuir Responsável
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setServiceToConclude(service)}
                        disabled={service.status === 'concluido' || service.status === 'medicina'}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Enviar para Medicina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Card>

      <AlertDialog open={!!serviceToConclude} onOpenChange={(open) => !open && setServiceToConclude(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
            <AlertDialogDescription>
                Você tem certeza que deseja concluir a digitação para a empresa <span className='font-bold'>{serviceToConclude?.nomeEmpresa}</span> e enviar para a Medicina?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => serviceToConclude && handleConclude(serviceToConclude.id)} className="bg-accent hover:bg-accent/90">Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {assigningDigitadorService && (
        <AssignDigitadorDialog
            open={!!assigningDigitadorService}
            onOpenChange={(open) => !open && setAssigningDigitadorService(null)}
            service={assigningDigitadorService}
            onSuccess={() => setAssigningDigitadorService(null)}
        />
      )}
    </>
  );
}
