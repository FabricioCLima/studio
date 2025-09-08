
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
import { FileText } from 'lucide-react';
import type { Service } from '@/app/(main)/engenharia/page';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface PgrTableProps {
  services: Service[];
  onSelectService: (service: Service) => void;
}

export function PgrTable({ services, onSelectService }: PgrTableProps) {

  if (services.length === 0) {
    return (
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>Nenhum serviço ativo encontrado.</p>
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
              <TableHead className="w-[100px]">Ações</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="hidden md:table-cell">CNPJ</TableHead>
              <TableHead>Fichas PGR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                    <Button variant="outline" size="sm" onClick={() => onSelectService(service)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Gerenciar
                    </Button>
                </TableCell>
                <TableCell className="font-medium">{service.nomeEmpresa}</TableCell>
                <TableCell className="hidden md:table-cell">{service.cnpj}</TableCell>
                <TableCell>
                    <Badge variant={service.fichasPGR && service.fichasPGR.length > 0 ? 'success' : 'secondary'}>
                        {service.fichasPGR?.length || 0}
                    </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </Card>
      </>
  );
}
