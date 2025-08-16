
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
import { CheckCircle2, PlayCircle } from 'lucide-react';
import type { Service } from '@/app/(main)/engenharia/page';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from './ui/card';
import { StatusBadge } from './status-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TecnicaTableProps {
  services: Service[];
}

export function TecnicaTable({ services }: TecnicaTableProps) {
    const { toast } = useToast();

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
              <TableCell className="text-right space-x-2">
                
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(service.id, 'em_visita')} disabled={service.status === 'em_visita' || service.status === 'concluido'}>
                                <PlayCircle className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Iniciar Visita</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(service.id, 'concluido')} disabled={service.status === 'concluido'}>
                                <CheckCircle2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Concluir Serviço</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Card>
    </>
  );
}
