
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Service } from '@/app/(main)/engenharia/page';
import { UploadFilesForm } from './upload-files-form';

interface UploadFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
}

export function UploadFilesDialog({ open, onOpenChange, service }: UploadFilesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Arquivos</DialogTitle>
          <DialogDescription>
            Anexe arquivos ao serviço da empresa {service.nomeEmpresa}.
          </DialogDescription>
        </DialogHeader>
        <UploadFilesForm service={service} onSave={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
