
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
import { useToast } from '@/hooks/use-toast';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from './ui/card';
import { useState } from 'react';
import type { Tecnico } from '@/app/(main)/tecnicos/page';
import { TecnicoDialog } from './tecnico-dialog';

interface TecnicosTableProps {
  tecnicos: Tecnico[];
}

export function TecnicosTable({ tecnicos }: TecnicosTableProps) {
    const { toast } = useToast();
    const [editingTecnico, setEditingTecnico] = useState<Tecnico | null>(null);

    const handleDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, "tecnicos", id));
            toast({
                title: 'Sucesso!',
                description: 'Técnico excluído com sucesso.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro!',
                description: 'Não foi possível excluir o técnico.',
            });
        }
    }

  if (tecnicos.length === 0) {
    return (
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                <p>Nenhum técnico encontrado.</p>
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
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tecnicos.map((tecnico) => (
            <TableRow key={tecnico.id}>
              <TableCell className="font-medium">{tecnico.nome}</TableCell>
              <TableCell>{tecnico.email || '-'}</TableCell>
              <TableCell>{tecnico.telefone || '-'}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => setEditingTecnico(tecnico)}>
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
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o técnico.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(tecnico.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Card>
      {editingTecnico && (
        <TecnicoDialog
          tecnico={editingTecnico}
          open={!!editingTecnico}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTecnico(null);
            }
          }}
          onSave={() => setEditingTecnico(null)}
        />
      )}
    </>
  );
}
