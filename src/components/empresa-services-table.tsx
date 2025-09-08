
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
import { Card, CardContent } from './ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatusBadge } from './status-badge';

interface EmpresaServicesTableProps {
  services: Service[];
}

export function EmpresaServicesTable({ services }: EmpresaServicesTableProps) {

  if (services.length === 0) {
    return (
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>Nenhum serviço encontrado para esta empresa.</p>
            </CardContent>
        </Card>
    )
  }

  const sortedServices = [...services].sort((a, b) => {
    const dateA = a.dataServico?.seconds || 0;
    const dateB = b.dataServico?.seconds || 0;
    return dateB - dateA;
  });

  return (
    <>
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data do Serviço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Responsável</TableHead>
              <TableHead className="hidden lg:table-cell">Técnico</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedServices.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">
                    {service.dataServico 
                        ? format(new Date(service.dataServico.seconds * 1000), 'dd/MM/yyyy', { locale: ptBR })
                        : 'Data não informada'
                    }
                </TableCell>
                <TableCell><StatusBadge service={service} /></TableCell>
                <TableCell className="hidden md:table-cell">{service.responsavel || '-'}</TableCell>
                <TableCell className="hidden lg:table-cell">{service.tecnico || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </Card>
      </>
  );
}
