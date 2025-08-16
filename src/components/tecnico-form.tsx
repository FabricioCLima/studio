
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import type { Tecnico } from '@/app/(main)/tecnicos/page';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório.'),
  email: z.string().email({ message: "E-mail inválido." }).optional().or(z.literal('')),
  telefone: z.string().optional(),
});

interface TecnicoFormProps {
    onSave?: () => void;
    tecnico?: Tecnico | null;
}

export function TecnicoForm({ onSave, tecnico }: TecnicoFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
    },
  });

  useEffect(() => {
    if (tecnico) {
      form.reset({
        ...tecnico,
        email: tecnico.email || '',
        telefone: tecnico.telefone || '',
      });
    } else {
        form.reset({
            nome: '',
            email: '',
            telefone: '',
        });
    }
  }, [tecnico, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const dataToSave = {
            ...values,
            email: values.email || null,
            telefone: values.telefone || null,
        }

        if(tecnico) {
            const tecnicoRef = doc(db, 'tecnicos', tecnico.id);
            await updateDoc(tecnicoRef, dataToSave);
            toast({
                title: 'Sucesso!',
                description: 'Técnico atualizado com sucesso.',
                className: 'bg-accent text-accent-foreground',
            });
        } else {
            await addDoc(collection(db, 'tecnicos'), {
                ...dataToSave,
                createdAt: serverTimestamp(),
            });
            toast({
                title: 'Sucesso!',
                description: 'Técnico cadastrado com sucesso.',
                className: 'bg-accent text-accent-foreground',
            });
        }
      form.reset();
      onSave?.();
    } catch (error) {
      console.error('Error saving document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível salvar o técnico.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="nome" render={({ field }) => (
            <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome completo" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
        <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="email@tecnico.com" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
        <FormField control={form.control} name="telefone" render={({ field }) => (
            <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
