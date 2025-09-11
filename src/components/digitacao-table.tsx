
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
import { CheckCircle2, FileText, MoreHorizontal, Undo2 } from 'lucide-react';
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
import { useRouter } from 'next/navigation';

interface DigitacaoTableProps {
  services: Service[];
}

export function DigitacaoTable({ services }: DigitacaoTableProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [serviceToConclude, setServiceToConclude] = useState<Service | null>(null);
    const [serviceToReturn, setServiceToReturn] = useState<Service | null>(null);

    const handleUpdateStatus = async (service: Service, newStatus: 'medicina' | 'avaliacao') => {
        try {
            const serviceRef = doc(db, 'servicos', service.id);
            await updateDoc(serviceRef, {
                status: newStatus
            });
            toast({
                title: 'Sucesso!',
                description: `Serviço enviado para a ${newStatus === 'medicina' ? 'Medicina' : 'Avaliação na Engenharia'}.`,
                className: 'bg-accent text-accent-foreground',
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Erro!',
                description: 'Não foi possível atualizar o status do serviço.',
            });
        } finally {
            setServiceToConclude(null);
            setServiceToReturn(null);
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
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Ações</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead>Responsável</TableHead>
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
                      <DropdownMenuItem onClick={() => router.push(`/tecnica/${service.id}`)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Ficha
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setServiceToReturn(service)}>
                        <Undo2 className="mr-2 h-4 w-4" />
                        Enviar para Engenharia
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setServiceToConclude(service)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Enviar para Medicina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </TableCell>
              <TableCell className="font-medium">{service.nomeEmpresa}</TableCell>
              <TableCell className="hidden md:table-cell">
                <StatusBadge service={service} />
              </TableCell>
               <TableCell>{service.digitador || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      </Card>

      <AlertDialog open={!!serviceToConclude} onOpenChange={(open) => !open && setServiceToConclude(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Envio</AlertDialogTitle>
            <AlertDialogDescription>
                Você tem certeza que deseja concluir a digitação para a empresa <span className='font-bold'>{serviceToConclude?.nomeEmpresa}</span> e enviar para a Medicina?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => serviceToConclude && handleUpdateStatus(serviceToConclude, 'medicina')} className="bg-accent hover:bg-accent/90">Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={!!serviceToReturn} onOpenChange={(open) => !open && setServiceToReturn(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Retorno</AlertDialogTitle>
            <AlertDialogDescription>
                Você tem certeza que deseja retornar o serviço da empresa <span className='font-bold'>{serviceToReturn?.nomeEmpresa}</span> para avaliação na Engenharia?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => serviceToReturn && handleUpdateStatus(serviceToReturn, 'avaliacao')} className="bg-primary hover:bg-primary/90">Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
