
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TecnicoForm } from './tecnico-form';
import type { Tecnico } from '@/app/(main)/tecnicos/page';

interface TecnicoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  tecnico?: Tecnico | null;
}

export function TecnicoDialog({ open, onOpenChange, onSave, tecnico }: TecnicoDialogProps) {
  const title = tecnico ? 'Editar Técnico' : 'Cadastrar Técnico';
  const description = tecnico 
    ? 'Altere as informações do técnico abaixo.'
    : 'Preencha as informações para cadastrar um novo técnico.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <TecnicoForm onSave={onSave} tecnico={tecnico} />
      </DialogContent>
    </Dialog>
  );
}
