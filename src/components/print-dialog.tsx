
'use client';

import type { Service } from '@/app/(main)/engenharia/page';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';
import { PrintableServiceCard } from './printable-service-card';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
}

export function PrintDialog({ open, onOpenChange, service }: PrintDialogProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Dossie-Servico-${service.nomeEmpresa.replace(/\s/g, '-')}`,
  });

  const hasAnyFicha = (service.fichasVisita && service.fichasVisita.length > 0) ||
                      (service.fichasPGR && service.fichasPGR.length > 0) ||
                      (service.fichasLTCAT && service.fichasLTCAT.length > 0);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Imprimir Dossiê de Serviço</DialogTitle>
          <DialogDescription>
            Revise as informações abaixo. Todas as fichas (Visita, PGR, LTCAT) serão incluídas.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-1 border rounded-md">
          <PrintableServiceCard ref={componentRef} service={service} />
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={handlePrint} disabled={!hasAnyFicha}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir Dossiê
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
