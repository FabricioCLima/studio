
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
import { CheckCircle2, MoreHorizontal, Pencil, Printer } from 'lucide-react';
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
import { PrintDialog } from './print-dialog';

interface DigitacaoTableProps {
  services: Service[];
}

export function DigitacaoTable({ services }: DigitacaoTableProps) {
    const { toast } = useToast();
    const [serviceToConclude, setServiceToConclude] = useState<Service | null>(null);
    const [assigningDigitadorService, setAssigningDigitadorService] = useState<Service | null>(null);
    const [printingService, setPrintingService] = useState<Service | null>(null);

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
                      <DropdownMenuItem onClick={() => setAssigningDigitadorService(service)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Atribuir Responsável
                      </DropdownMenuItem>
                       <DropdownMenuItem 
                        onClick={() => setPrintingService(service)} 
                        disabled={!service.fichasVisita || service.fichasVisita.length === 0}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Visualizar Ficha
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setServiceToConclude(service)}
                        disabled={service.status === 'concluido' || service.status === 'medicina'}>
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
