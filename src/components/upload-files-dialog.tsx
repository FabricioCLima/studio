
'use client';

import type { Service } from '@/app/(main)/engenharia/page';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { UploadFilesForm } from './upload-files-form';

interface UploadFilesDialogProps {
  service: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadFilesDialog({ service, open, onOpenChange }: UploadFilesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload de Anexos</DialogTitle>
          <DialogDescription>
            Adicione os arquivos para o serviço da empresa: {service.nomeEmpresa}
          </DialogDescription>
        </DialogHeader>
        
        <UploadFilesForm service={service} onSave={() => onOpenChange(false)} />

      </DialogContent>
    </Dialog>
  );
}
