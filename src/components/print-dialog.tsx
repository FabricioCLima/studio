
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

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
}

export function PrintDialog({ open, onOpenChange, service }: PrintDialogProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    const printContent = componentRef.current;
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=800');
      
      if (printWindow) {
        printWindow.document.write('<html><head><title>Imprimir Ficha</title>');
        // Injeta os estilos da aplicação na janela de impressão
        Array.from(document.styleSheets).forEach(styleSheet => {
          try {
            if (styleSheet.cssRules) {
              const style = printWindow.document.createElement('style');
              style.textContent = Array.from(styleSheet.cssRules)
                .map(rule => rule.cssText)
                .join('\n');
              printWindow.document.head.appendChild(style);
            }
          } catch (e) {
            console.warn('Could not read stylesheet for printing:', e);
          }
        });
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Imprimir Ficha de Serviço</DialogTitle>
          <DialogDescription>
            Revise as informações abaixo. Apenas este conteúdo será impresso.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-1">
          <PrintableServiceCard ref={componentRef} service={service} />
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
