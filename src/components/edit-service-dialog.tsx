
'use client';

import type { Service } from '@/app/(main)/engenharia/page';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarPopover } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Tecnico } from '@/app/(main)/tecnicos/page';

const formSchema = z.object({
  dataAgendamento: z.date().optional().nullable(),
  tecnico: z.string().optional(),
});

interface EditServiceDialogProps {
  service: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditServiceDialog({ service, open, onOpenChange }: EditServiceDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'tecnicos'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tecnicosData: Tecnico[] = [];
      querySnapshot.forEach((doc) => {
        tecnicosData.push({ id: doc.id, ...doc.data() } as Tecnico);
      });
      setTecnicos(tecnicosData);
    });
    return () => unsubscribe();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (service) {
      form.reset({
        dataAgendamento: service.dataAgendamento ? new Date(service.dataAgendamento.seconds * 1000) : null,
        tecnico: service.tecnico || '',
      });
    }
  }, [service, form, open]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const serviceRef = doc(db, 'servicos', service.id);
      
      const dataToUpdate: { [key: string]: any } = {
        dataAgendamento: values.dataAgendamento,
      };
      
      const tecnicoValue = values.tecnico === 'nenhum' ? null : values.tecnico;

      if (values.dataAgendamento && tecnicoValue) {
        dataToUpdate.status = 'aguardando_visita';
      } else if (values.dataAgendamento) {
        dataToUpdate.status = 'agendado';
      } else {
        if (['agendado', 'aguardando_visita', 'em_visita'].includes(service.status)) {
            dataToUpdate.status = 'engenharia';
        }
      }

      if (!values.dataAgendamento) {
        dataToUpdate.dataAgendamento = null;
        dataToUpdate.tecnico = null;
      } else {
        dataToUpdate.tecnico = tecnicoValue;
      }

      await updateDoc(serviceRef, dataToUpdate);
      toast({
        title: 'Sucesso!',
        description: 'Agendamento atualizado com sucesso.',
        className: 'bg-accent text-accent-foreground',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível atualizar o agendamento.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
          <DialogDescription>
            Defina a data e o técnico para o serviço da empresa: <span className="font-semibold">{service.nomeEmpresa}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
                 <FormField control={form.control} name="dataAgendamento" render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Data de Agendamento</FormLabel>
                        <CalendarPopover mode="single" selected={field.value} onSelect={field.onChange}>
                             <FormControl>
                                <Button variant={'outline'} className={cn('w-full justify-start pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                  {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Agendar visita</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                        </CalendarPopover>
                      <FormMessage />
                    </FormItem>
                  )}/>
                 <FormField control={form.control} name="tecnico" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Técnico Responsável</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um técnico" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="nenhum">Nenhum</SelectItem>
                                {tecnicos.map(tecnico => (
                                    <SelectItem key={tecnico.id} value={tecnico.nome}>{tecnico.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormItem>
                 )}/>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
                {isSubmitting ? 'Salvando...' : 'Salvar Agendamento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
