
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { Service } from '@/app/(main)/engenharia/page';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from './ui/card';
import { useState } from 'react';
import { EditServiceDialog } from './edit-service-dialog';
import { Badge } from './ui/badge';

interface CadastroTableProps {
  services: Service[];
}

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" | "success" } = {
    engenharia: "default",
    agendado: "success",
    tecnica: "secondary",
    digitacao: "outline",
    medicina: "destructive",
}

const statusLabel: { [key: string]: string } = {
    engenharia: "Engenharia",
    agendado: "Agendado",
    tecnica: "Técnica",
    digitacao: "Digitação",
    medicina: "Medicina",
}


export function CadastroTable({ services }: CadastroTableProps) {
    const { toast } = useToast();
    const [editingService, setEditingService] = useState<Service | null>(null);

    const handleDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, "servicos", id));
            toast({
                title: 'Sucesso!',
                description: 'Serviço excluído com sucesso.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro!',
                description: 'Não foi possível excluir o serviço.',
            });
        }
    }

  if (services.length === 0) {
    return (
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>Nenhum serviço encontrado.</p>
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
            <TableHead>CNPJ</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">{service.nomeEmpresa}</TableCell>
              <TableCell>{service.cnpj}</TableCell>
              <TableCell>
                {service.dataServico ? format(new Date(service.dataServico.seconds * 1000), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[service.status] || 'secondary'}>
                    {statusLabel[service.status] || service.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => setEditingService(service)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o serviço.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(service.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Card>
      {editingService && (
        <EditServiceDialog
          service={editingService}
          open={!!editingService}
          onOpenChange={(open) => {
            if (!open) {
              setEditingService(null);
            }
          }}
        />
      )}
    </>
  );
}
