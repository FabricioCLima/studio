'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { CadastroForm } from './cadastro-form';
import { Button } from './ui/button';

interface CadastroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CadastroDialog({ open, onOpenChange }: CadastroDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastro de Serviço</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para cadastrar um novo serviço.
          </DialogDescription>
        </DialogHeader>
        
        <CadastroForm onSave={() => onOpenChange(false)} />

      </DialogContent>
    </Dialog>
  );
}
