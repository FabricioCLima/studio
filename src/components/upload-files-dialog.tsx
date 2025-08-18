
'use client';

import type { Service } from "@/app/(main)/engenharia/page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { UploadFilesForm } from "./upload-files-form";

interface UploadFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  onSuccess: () => void;
}

export function UploadFilesDialog({ open, onOpenChange, service, onSuccess }: UploadFilesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Anexos</DialogTitle>
          <DialogDescription>
            Selecione os arquivos para o serviço da empresa: <span className="font-semibold">{service.nomeEmpresa}</span>
          </DialogDescription>
        </DialogHeader>
        
        <UploadFilesForm service={service} onSave={onSuccess} />

      </DialogContent>
    </Dialog>
  );
}
