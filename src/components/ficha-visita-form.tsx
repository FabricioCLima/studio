
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Service } from '@/app/(main)/engenharia/page';
import { Textarea } from './ui/textarea';
import { useAuth } from '@/context/auth-context';
import { Input } from './ui/input';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';

const itemVerificacaoSchema = z.object({
    status: z.enum(['c', 'nc', 'na'], { required_error: 'Selecione uma opção.' }),
    observacoes: z.string().optional(),
});

const naoConformidadeSchema = z.object({
    descricao: z.string().min(1, 'Descrição é obrigatória.'),
    riscoAssociado: z.string().min(1, 'Risco é obrigatório.'),
    recomendacao: z.string().min(1, 'Recomendação é obrigatória.'),
    prazo: z.date({ required_error: 'Prazo é obrigatório.' }),
    responsavelAcao: z.string().min(1, 'Responsável é obrigatório.'),
});


const formSchema = z.object({
  setorInspecionado: z.string().min(1, 'Setor é obrigatório.'),
  dataVistoria: z.date({ required_error: 'Data é obrigatória.' }),
  horario: z.string().min(1, 'Horário é obrigatório.'),
  acompanhante: z.string().min(1, 'Acompanhante é obrigatório.'),
  tipoInspecao: z.enum(['rotina', 'denuncia', 'especifica', 'oficial'], { required_error: 'Selecione o tipo de inspeção.' }),
  itensVerificacao: z.record(itemVerificacaoSchema),
  naoConformidades: z.array(naoConformidadeSchema).optional(),
});


const checklistItems = {
    'Organização e Limpeza': [
        'O local está limpo e organizado?',
        'Corredores e passagens estão desobstruídos?',
    ],
    'Sinalização de Segurança': [
        'As saídas de emergência estão sinalizadas e desobstruídas?',
        'Placas de advertência (risco elétrico, piso molhado, etc.) estão visíveis?',
        'A sinalização de extintores e hidrantes está adequada?',
    ],
    'Equipamentos de Proteção Coletiva (EPC)': [
        'Guarda-corpos e rodapés estão em bom estado?',
        'Sistemas de ventilação/exaustão estão funcionando corretamente?',
    ],
    'Equipamentos de Combate a Incêndio': [
        'Extintores estão dentro da validade e com lacre intacto?',
        'Os acessos aos hidrantes e extintores estão livres?',
    ],
    'Instalações Elétricas': [
        'Fios e cabos elétricos estão protegidos e organizados?',
        'Quadros de energia estão sinalizados e com acesso restrito?',
    ],
    'Equipamentos de Proteção Individual (EPI)': [
        'Os colaboradores estão utilizando os EPIs necessários para a função?',
        'Os EPIs fornecidos estão em bom estado de conservação?',
    ],
    'Máquinas e Equipamentos': [
        'As máquinas possuem proteções de partes móveis?',
        'Dispositivos de parada de emergência estão acessíveis e funcionando?',
    ],
};

const generateInitialItensVerificacao = () => {
    return Object.values(checklistItems)
        .flat()
        .reduce((acc, item) => {
            acc[item] = { status: 'na', observacoes: '' };
            return acc;
        }, {} as z.infer<typeof formSchema>['itensVerificacao']);
}

const generateDefaultValues = () => ({
    dataVistoria: new Date(),
    horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    acompanhante: '',
    setorInspecionado: '',
    tipoInspecao: 'rotina' as 'rotina',
    itensVerificacao: generateInitialItensVerificacao(),
    naoConformidades: [],
});


interface FichaVisitaFormProps {
    service: Service;
    onSave?: () => void;
}

export function FichaVisitaForm({ service, onSave }: FichaVisitaFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: generateDefaultValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "naoConformidades",
  });


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const serviceRef = doc(db, 'servicos', service.id);
        
        const newFicha = {
            ...values,
            dataPreenchimento: new Date(),
            tecnico: service.tecnico || user?.displayName || 'Não identificado',
        }

        await updateDoc(serviceRef, {
            fichasVisita: arrayUnion(newFicha)
        });

        toast({
            title: 'Sucesso!',
            description: 'Ficha de visita salva com sucesso.',
            className: 'bg-accent text-accent-foreground',
        });
        
        form.reset(generateDefaultValues());
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4">
        
        <Card>
            <CardHeader>
                <CardTitle>1. Identificação da Inspeção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     <FormItem>
                        <FormLabel>Empresa</FormLabel>
                        <Input value={service.nomeEmpresa} disabled />
                    </FormItem>
                     <FormField
                        control={form.control}
                        name="setorInspecionado"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Setor/Área Inspecionada</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Produção" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control} name="dataVistoria" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Data da Vistoria</FormLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
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
                    <FormField control={form.control} name="horario" render={({ field }) => (
                        <FormItem><FormLabel>Horário</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormItem>
                        <FormLabel>Responsável pela Vistoria</FormLabel>
                        <Input value={service.tecnico || 'Não atribuído'} disabled />
                    </FormItem>
                    <FormField control={form.control} name="acompanhante" render={({ field }) => (
                        <FormItem><FormLabel>Acompanhante(s) da Área</FormLabel><FormControl><Input placeholder="Nome(s) do(s) acompanhante(s)" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField
                    control={form.control}
                    name="tipoInspecao"
                    render={({ field }) => (
                        <FormItem className="space-y-3 pt-4">
                        <FormLabel>Tipo de Inspeção</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6"
                            >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="rotina" /></FormControl>
                                <FormLabel className="font-normal">Rotina</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="denuncia" /></FormControl>
                                <FormLabel className="font-normal">Denúncia</FormLabel>
                            </FormItem>
                             <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="especifica" /></FormControl>
                                <FormLabel className="font-normal">Específica</FormLabel>
                            </FormItem>
                             <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="oficial" /></FormControl>
                                <FormLabel className="font-normal">Oficial</FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>2. Itens de Verificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {Object.entries(checklistItems).map(([category, items]) => (
                    <div key={category}>
                        <h4 className="font-semibold text-md mb-4 border-b pb-2">{category}</h4>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <FormField
                                    key={item}
                                    control={form.control}
                                    name={`itensVerificacao.${item}`}
                                    render={({ field }) => (
                                       <div className="space-y-2 p-3 border rounded-md">
                                             <FormLabel className="text-sm font-medium">{item}</FormLabel>
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={(value) => field.onChange({ ...(field.value || {}), status: value })}
                                                        value={field.value?.status}
                                                        className="flex space-x-4"
                                                    >
                                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="c" /></FormControl><FormLabel className="font-normal text-sm">C</FormLabel></FormItem>
                                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="nc" /></FormControl><FormLabel className="font-normal text-sm">NC</FormLabel></FormItem>
                                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="na" /></FormControl><FormLabel className="font-normal text-sm">NA</FormLabel></FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="Observações / Ações Corretivas" 
                                                        value={field.value?.observacoes || ''}
                                                        onChange={(e) => field.onChange({ ...(field.value || {}), observacoes: e.target.value })}
                                                    />
                                                </FormControl>
                                             </div>
                                             <FormMessage />
                                       </div>
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>3. Descrição de Não Conformidades e Recomendações</CardTitle>
                <CardDescription>Adicione as não conformidades encontradas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                        <h5 className="font-semibold">Não Conformidade {index + 1}</h5>
                        <FormField
                            control={form.control}
                            name={`naoConformidades.${index}.descricao`}
                            render={({ field }) => (
                                <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva a não conformidade" {...field} /></FormControl><FormMessage /></FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name={`naoConformidades.${index}.riscoAssociado`} render={({ field }) => (
                                <FormItem><FormLabel>Risco Associado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name={`naoConformidades.${index}.recomendacao`} render={({ field }) => (
                                <FormItem><FormLabel>Recomendação</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name={`naoConformidades.${index}.prazo`} render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Prazo para Correção</FormLabel>
                                    <Popover><PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                            {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha um prazo</span>}
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
                            <FormField control={form.control} name={`naoConformidades.${index}.responsavelAcao`} render={({ field }) => (
                                <FormItem><FormLabel>Responsável pela Ação</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                         <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-4 right-4"
                            onClick={() => remove(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => append({ descricao: '', riscoAssociado: '', recomendacao: '', prazo: new Date(), responsavelAcao: '' })}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Não Conformidade
                </Button>
            </CardContent>
        </Card>

        <Card>
             <CardHeader>
                <CardTitle>4. Conclusão e Assinaturas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                    <div className="flex flex-col items-center">
                        <Separator className="bg-foreground" />
                        <p className="mt-2 text-sm font-semibold">Assinatura do Responsável pela Vistoria</p>
                         <p className="text-sm text-muted-foreground">{service.tecnico || 'Não atribuído'}</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <Separator className="bg-foreground" />
                        <p className="mt-2 text-sm font-semibold">Assinatura do Responsável pela Área</p>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
            {isSubmitting ? 'Salvando Ficha...' : 'Salvar Ficha de Visita'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    