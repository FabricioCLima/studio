
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
import { Download } from 'lucide-react';
import type { Service } from '@/app/(main)/engenharia/page';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import { StatusBadge } from './status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface DigitacaoTableProps {
  services: Service[];
}

export function DigitacaoTable({ services }: DigitacaoTableProps) {
    const { toast } = useToast();

    const handleDownload = (url: string, filename: string) => {
        try {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.download = filename;
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
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Anexos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">{service.nomeEmpresa}</TableCell>
              <TableCell>
                <StatusBadge service={service} />
              </TableCell>
              <TableCell className="text-right">
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
                                <DropdownMenuItem key={index} onClick={() => handleDownload(anexo.url, anexo.name)}>
                                    {anexo.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    '-'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Card>
  );
}
