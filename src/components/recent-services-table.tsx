
'use client';

import type { Service } from "@/app/(main)/engenharia/page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentServicesTableProps {
    services: Service[];
}

export function RecentServicesTable({ services }: RecentServicesTableProps) {
    const sortedServices = [...services]
        .sort((a, b) => {
            const dateA = a.dataServico?.seconds || 0;
            const dateB = b.dataServico?.seconds || 0;
            return dateB - dateA;
        })
        .slice(0, 7);

    return (
        <div className="overflow-x-auto">
         <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Data Cadastro</TableHead>
                <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedServices.map((service) => (
                <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.nomeEmpresa}</TableCell>
                    <TableCell>
                        {service.dataServico
                            ? format(new Date(service.dataServico.seconds * 1000), 'dd/MM/yy', { locale: ptBR })
                            : '-'}
                    </TableCell>
                    <TableCell>
                    <StatusBadge service={service} />
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
        </div>
    );
}
