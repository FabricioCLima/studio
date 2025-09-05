
'use client';

import type { Service } from "@/app/(main)/engenharia/page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FichaVisitaForm } from "./ficha-visita-form";

interface FichaVisitaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  onSuccess: () => void;
}

export function FichaVisitaDialog({ open, onOpenChange, service, onSuccess }: FichaVisitaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ficha de Visita Técnica</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da visita para a empresa: <span className="font-semibold">{service.nomeEmpresa}</span>
          </DialogDescription>
        </DialogHeader>
        
        <FichaVisitaForm service={service} onSave={onSuccess} />

      </DialogContent>
    </Dialog>
  );
}
