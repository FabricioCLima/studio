
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

// This component is no longer used and can be removed in a future cleanup.
export function FichaVisitaDialog({ open, onOpenChange, service, onSuccess }: FichaVisitaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ficha de Visita Técnica</DialogTitle>
          <DialogDescription>
            Preencha as informações da visita para a empresa: <span className="font-semibold">{service.nomeEmpresa}</span>
          </DialogDescription>
        </DialogHeader>
        
        <FichaVisitaForm service={service} onSave={onSuccess} />

      </DialogContent>
    </Dialog>
  );
}
