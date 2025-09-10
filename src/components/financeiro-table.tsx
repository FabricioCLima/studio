
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
import { CheckCircle2, MoreHorizontal } from 'lucide-react';
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

interface FinanceiroTableProps {
  services: Service[];
}

export function FinanceiroTable({ services }: FinanceiroTableProps) {
    const { toast } = useToast();
    const [serviceToConclude, setServiceToConclude] = useState<Service | null>(null);

    const handleConclude = async (serviceId: string) => {
        try {
            const serviceRef = doc(db, 'servicos', serviceId);
            await updateDoc(serviceRef, {
                status: 'concluido'
            });
            toast({
                title: 'Sucesso!',
                description: 'Serviço concluído com sucesso (pago).',
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
    
    const calculateTotal = (servicos: { nome: string; valor?: number }[]) => {
        return servicos.reduce((total, servico) => total + (servico.valor || 0), 0);
    }


  if (services.length === 0) {
    return (
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>Nenhum serviço pendente no setor financeiro.</p>
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
            <TableHead className="hidden lg:table-cell">Serviços</TableHead>
            <TableHead className="hidden md:table-cell">Valor Total</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead>Responsável Medicina</TableHead>
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
                        onClick={() => setServiceToConclude(service)}
                        disabled={service.status === 'concluido'}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Marcar como Pago
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </TableCell>
              <TableCell className="font-medium">{service.nomeEmpresa}</TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex flex-col">
                  {service.servicos.map((s, i) => (
                    <span key={i} className="text-xs">{s.nome}</span>
                  ))}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell font-mono">
                {calculateTotal(service.servicos).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <StatusBadge service={service} />
              </TableCell>
              <TableCell>{service.medicinaResponsavel || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      </Card>

      <AlertDialog open={!!serviceToConclude} onOpenChange={(open) => !open && setServiceToConclude(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
                Você tem certeza que deseja marcar o serviço para a empresa <span className='font-bold'>{serviceToConclude?.nomeEmpresa}</span> como pago e concluído?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => serviceToConclude && handleConclude(serviceToConclude.id)} className="bg-accent hover:bg-accent/90">Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
