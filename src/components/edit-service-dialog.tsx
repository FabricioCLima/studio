
'use client';

import type { Service } from '@/app/(main)/engenharia/page';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
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
  cnpj: z.string().min(1, 'CNPJ é obrigatório.'),
  nomeEmpresa: z.string().min(1, 'Nome da empresa é obrigatório.'),
  cep: z.string().min(1, 'CEP é obrigatório.'),
  cidade: z.string().min(1, 'Cidade é obrigatória.'),
  endereco: z.string().min(1, 'Endereço é obrigatório.'),
  bairro: z.string().min(1, 'Bairro é obrigatório.'),
  complemento: z.string().optional(),
  telefone: z.string().min(1, 'Telefone é obrigatório.'),
  contato: z.string().min(1, 'Contato é obrigatório.'),
  email: z.string().email({ message: "E-mail inválido." }).optional().or(z.literal('')),
  servicos: z.array(z.object({ value: z.string() })).optional(),
  dataServico: z.date({ required_error: 'Data do serviço é obrigatória.' }),
  dataAgendamento: z.date().optional(),
  tecnico: z.string().optional(),
  status: z.string().optional(),
});

interface EditServiceDialogProps {
  service: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditServiceDialog({ service, open, onOpenChange }: EditServiceDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
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
      email: '',
      servicos: [{ value: '' }],
    },
  });

  useEffect(() => {
    if (service) {
      form.reset({
        ...service,
        servicos: service.servicos.map((s) => ({ value: s })),
        dataServico: new Date(service.dataServico.seconds * 1000),
        dataAgendamento: service.dataAgendamento ? new Date(service.dataAgendamento.seconds * 1000) : undefined,
        tecnico: service.tecnico || '',
      });
    }
  }, [service, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'servicos',
  });

  const fetchCep = async () => {
    const cep = form.getValues('cep').replace(/\D/g, '');
    if (cep.length !== 8) {
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
      const serviceRef = doc(db, 'servicos', service.id);
      
      const dataToUpdate: { [key: string]: any } = {
        ...values,
        servicos: values.servicos ? values.servicos.map((s) => s.value).filter(s => s.trim() !== '') : [],
      };

      if (values.dataAgendamento) {
        dataToUpdate.status = 'agendado';
      } else {
        dataToUpdate.dataAgendamento = null;
        if(service.status === 'agendado') {
            dataToUpdate.status = 'engenharia';
        }
      }

      if (!values.tecnico) {
        dataToUpdate.tecnico = null;
      }

      await updateDoc(serviceRef, dataToUpdate);
      toast({
        title: 'Sucesso!',
        description: 'Serviço atualizado com sucesso.',
        className: 'bg-accent text-accent-foreground',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível atualizar o serviço.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Serviço</DialogTitle>
          <DialogDescription>
            Altere as informações do serviço abaixo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FormField control={form.control} name="cnpj" render={({ field }) => (
                  <FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input placeholder="00.000.000/0000-00" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              <FormField control={form.control} name="nomeEmpresa" render={({ field }) => (
                  <FormItem className="lg:col-span-2"><FormLabel>Nome da Empresa</FormLabel><FormControl><Input placeholder="Nome Fantasia" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              <FormField control={form.control} name="cep" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} onBlur={fetchCep} disabled={isCepLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
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
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="contato@empresa.com" {...field} /></FormControl><FormMessage /></FormItem>
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
                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <div className="grid grid-cols-1 gap-6 border-t pt-6 md:grid-cols-2">
                 <FormField control={form.control} name="dataAgendamento" render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Data de Agendamento</FormLabel>
                      <Popover><PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={'outline'} className={cn('w-[240px] pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                              {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Agendar visita</span>}
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
                 <FormField control={form.control} name="tecnico" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Técnico Responsável</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um técnico" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
