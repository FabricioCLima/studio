'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, PlusCircle, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState } from 'react';

const formSchema = z.object({
  cnpj: z.string().min(1, 'CNPJ é obrigatório.'),
  nomeEmpresa: z.string().min(1, 'Nome da empresa é obrigatório.'),
  cep: z.string().min(1, 'CEP é obrigatório.'),
  cidade: z.string().min(1, 'Cidade é obrigatória.'),
  endereco: z.string().min(1, 'Endereço é obrigatório.'),
  bairro: z.string().min(1, 'Bairro é obrigatório.'),
  complemento: z.string().optional(),
  telefone: z.string().min(1, 'Telefone é obrigatório.'),
  contato: z.string().min(1, 'Contato é obrigatório.'),
  servicos: z.array(z.object({ value: z.string().min(1, 'Serviço não pode ser vazio.') })).min(1, 'Adicione pelo menos um serviço.'),
  dataServico: z.date({ required_error: 'Data do serviço é obrigatória.' }),
});

interface CadastroFormProps {
    onSave?: () => void;
}

export function CadastroForm({ onSave }: CadastroFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cnpj: '',
      nomeEmpresa: '',
      cep: '',
      cidade: '',
      endereco: '',
      bairro: '',
      complemento: '',
      telefone: '',
      contato: '',
      servicos: [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'servicos',
  });
  
  const fetchCep = async () => {
    const cep = form.getValues('cep').replace(/\D/g, '');
    if (cep.length !== 8) {
      toast({ variant: 'destructive', title: 'CEP inválido.' });
      return;
    }
    setIsCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data.erro) {
        toast({ variant: 'destructive', title: 'CEP não encontrado.' });
      } else {
        form.setValue('endereco', data.logradouro);
        form.setValue('bairro', data.bairro);
        form.setValue('cidade', data.localidade);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar CEP.' });
    } finally {
      setIsCepLoading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'servicos'), {
        ...values,
        servicos: values.servicos.map(s => s.value),
        status: 'engenharia',
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Sucesso!',
        description: 'Serviço cadastrado com sucesso.',
        className: 'bg-accent text-accent-foreground',
      });
      form.reset();
      onSave?.();
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível cadastrar o serviço.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FormField control={form.control} name="cnpj" render={({ field }) => (
                <FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input placeholder="00.000.000/0000-00" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            <FormField control={form.control} name="nomeEmpresa" render={({ field }) => (
                <FormItem className="lg:col-span-2"><FormLabel>Nome da Empresa</FormLabel><FormControl><Input placeholder="Nome Fantasia" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            <FormField control={form.control} name="cep" render={({ field }) => (
                <FormItem><FormLabel>CEP</FormLabel><FormControl><div className="flex gap-2"><Input placeholder="00000-000" {...field} /><Button type="button" onClick={fetchCep} disabled={isCepLoading}><Search className="h-4 w-4" /></Button></div></FormControl><FormMessage /></FormItem>
              )}/>
            <FormField control={form.control} name="cidade" render={({ field }) => (
                <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="Cidade" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            <FormField control={form.control} name="endereco" render={({ field }) => (
                <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Rua, Av..." {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            <FormField control={form.control} name="bairro" render={({ field }) => (
                <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Bairro" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            <FormField control={form.control} name="complemento" render={({ field }) => (
                <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Apto, Bloco, etc." {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            <FormField control={form.control} name="telefone" render={({ field }) => (
                <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            <FormField control={form.control} name="contato" render={({ field }) => (
                <FormItem><FormLabel>Contato</FormLabel><FormControl><Input placeholder="Nome do contato" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <FormLabel>Serviços</FormLabel>
              {fields.map((field, index) => (
                <FormField key={field.id} control={form.control} name={`servicos.${index}.value`} render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input placeholder={`Serviço ${index + 1}`} {...field} />
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Serviço</Button>
            </div>
            <FormField control={form.control} name="dataServico" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Data do Serviço</FormLabel>
                  <Popover><PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={'outline'} className={cn('w-[240px] pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                          {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}/>
          </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
            {isSubmitting ? 'Salvando...' : 'Salvar Cadastro'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
