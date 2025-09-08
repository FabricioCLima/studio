
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

interface PgrTableProps {
  services: Service[];
  onSelectCompany: (cnpj: string) => void;
}

export function PgrTable({ services, onSelectCompany }: PgrTableProps) {
    
  const uniqueCompanies = services.reduce((acc, service) => {
      if (service.cnpj && !acc.some(s => s.cnpj === service.cnpj)) {
          acc.push(service);
      }
      return acc;
  }, [] as Service[]);

  if (uniqueCompanies.length === 0) {
    return (
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>Nenhuma empresa com serviços ativos encontrada.</p>
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
              <TableHead className="w-[120px]">Ações</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uniqueCompanies.map((service) => (
              <TableRow key={service.cnpj}>
                <TableCell>
                    <Button variant="outline" size="sm" onClick={() => onSelectCompany(service.cnpj)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Gerenciar
                    </Button>
                </TableCell>
                <TableCell className="font-medium">{service.nomeEmpresa}</TableCell>
                <TableCell>{service.cnpj}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </Card>
      </>
  );
}
