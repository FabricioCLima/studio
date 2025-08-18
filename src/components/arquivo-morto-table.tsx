
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

interface ArquivoMortoTableProps {
  services: Service[];
}

export function ArquivoMortoTable({ services }: ArquivoMortoTableProps) {
  
  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Nenhum serviço arquivado.</p>
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
              <TableHead>Empresa</TableHead>
              <TableHead>Responsável Cadastro</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead>Responsável Digitação</TableHead>
              <TableHead>Data Cadastro</TableHead>
              <TableHead>Data Agendamento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.nomeEmpresa}</TableCell>
                <TableCell>{service.responsavel || '-'}</TableCell>
                <TableCell>{service.tecnico || '-'}</TableCell>
                <TableCell>{service.digitador || '-'}</TableCell>
                <TableCell>
                  {service.dataServico
                    ? format(new Date(service.dataServico.seconds * 1000), 'dd/MM/yyyy', { locale: ptBR })
                    : '-'}
                </TableCell>
                <TableCell>
                  {service.dataAgendamento
                    ? format(new Date(service.dataAgendamento.seconds * 1000), 'dd/MM/yyyy', { locale: ptBR })
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
    </>
  );
}
