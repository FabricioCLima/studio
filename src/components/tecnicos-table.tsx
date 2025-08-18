
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
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from './ui/card';
import { useState } from 'react';
import type { Tecnico } from '@/app/(main)/tecnicos/page';
import { TecnicoDialog } from './tecnico-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

interface TecnicosTableProps {
  tecnicos: Tecnico[];
}

export function TecnicosTable({ tecnicos }: TecnicosTableProps) {
    const { toast } = useToast();
    const [editingTecnico, setEditingTecnico] = useState<Tecnico | null>(null);
    const [deletingTecnico, setDeletingTecnico] = useState<Tecnico | null>(null);

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
        } finally {
            setDeletingTecnico(null);
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
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Ações</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden text-center md:table-cell">Email</TableHead>
            <TableHead className="hidden sm:table-cell">Telefone</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tecnicos.map((tecnico) => (
            <TableRow key={tecnico.id}>
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
                      <DropdownMenuItem onClick={() => setEditingTecnico(tecnico)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={() => setDeletingTecnico(tecnico)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </TableCell>
              <TableCell className="font-medium">{tecnico.nome}</TableCell>
              <TableCell className="hidden text-center md:table-cell">{tecnico.email || '-'}</TableCell>
              <TableCell className="hidden sm:table-cell">{tecnico.telefone || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      </Card>

      <AlertDialog open={!!deletingTecnico} onOpenChange={(open) => !open && setDeletingTecnico(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o técnico <span className="font-bold">{deletingTecnico?.nome}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingTecnico && handleDelete(deletingTecnico.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
