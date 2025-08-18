
'use client';

import type { Service } from "@/app/(main)/engenharia/page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';

interface AssignDigitadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  onSuccess: () => void;
}

const formSchema = z.object({
  digitador: z.string().min(1, 'O nome do responsável é obrigatório.'),
});


export function AssignDigitadorDialog({ open, onOpenChange, service, onSuccess }: AssignDigitadorDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      digitador: '',
    },
  });

  useEffect(() => {
      if (service) {
          form.setValue('digitador', service.digitador || '');
      }
  }, [service, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const serviceRef = doc(db, 'servicos', service.id);
        await updateDoc(serviceRef, {
            digitador: values.digitador
        });
      toast({
        title: 'Sucesso!',
        description: 'Responsável atribuído com sucesso.',
        className: 'bg-accent text-accent-foreground',
      });
      onSuccess();
    } catch (error) {
      console.error('Error updating document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível atribuir o responsável.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atribuir Responsável</DialogTitle>
          <DialogDescription>
            Insira o nome do responsável para o serviço da empresa: <span className="font-semibold">{service.nomeEmpresa}</span>
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="digitador"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Responsável</FormLabel>
                            <FormControl>
                                <Input placeholder="Nome do Responsável" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
                        {isSubmitting ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
