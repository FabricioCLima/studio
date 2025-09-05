
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState } from 'react';
import type { Service } from '@/app/(main)/engenharia/page';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

const formSchema = z.object({
  observacoes: z.string().optional(),
  checklist: z.object({
    item1: z.boolean().default(false),
    item2: z.boolean().default(false),
    item3: z.boolean().default(false),
    item4: z.boolean().default(false),
  }).default({}),
});

interface FichaVisitaFormProps {
    service: Service;
    onSave?: () => void;
}


export function FichaVisitaForm({ service, onSave }: FichaVisitaFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // TODO: Pré-popular com dados existentes se houver
    defaultValues: {
      observacoes: '',
      checklist: {
        item1: false,
        item2: false,
        item3: false,
        item4: false,
      },
    },
  });


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const serviceRef = doc(db, 'servicos', service.id);
        await updateDoc(serviceRef, {
            fichaVisita: {
                ...values,
                dataPreenchimento: new Date(),
                tecnico: service.tecnico,
            }
        });

        toast({
            title: 'Sucesso!',
            description: 'Ficha de visita salva com sucesso.',
            className: 'bg-accent text-accent-foreground',
        });
        
        onSave?.();

    } catch (error) {
        console.error('Error saving visit form: ', error);
        toast({
            variant: 'destructive',
            title: 'Erro!',
            description: 'Não foi possível salvar a ficha de visita.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const checklistItems = [
    { id: 'item1', label: 'Verificação de Equipamentos' },
    { id: 'item2', label: 'Análise de Ambiente' },
    { id: 'item3', label: 'Coleta de Dados' },
    { id: 'item4', label: 'Entrevista com Responsável' },
  ] as const;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div>
            <h3 className="text-lg font-medium">Checklist da Visita</h3>
            <div className="space-y-2 mt-4">
                 {checklistItems.map((item) => (
                    <FormField
                    key={item.id}
                    control={form.control}
                    name={`checklist.${item.id}`}
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>{item.label}</FormLabel>
                            </div>
                        </FormItem>
                    )}
                    />
                ))}
            </div>
        </div>

        <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Observações Gerais</FormLabel>
                    <FormControl>
                       <Textarea
                        placeholder="Digite aqui anotações, detalhes importantes ou problemas encontrados durante a visita..."
                        className="resize-y min-h-[100px]"
                        {...field}
                        />
                    </FormControl>
                     <FormMessage />
                </FormItem>
            )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
            {isSubmitting ? 'Salvando...' : 'Salvar Ficha'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
