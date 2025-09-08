
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FichaPGR, Service } from '@/app/(main)/engenharia/page';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { CalendarIcon, PlusCircle, Signature, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarPopover } from './ui/calendar';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

const planoAcaoSchema = z.object({
    descricaoNaoConformidade: z.string().min(1, 'Descrição é obrigatória.'),
    registroFotografico: z.string().optional(),
    nivelRisco: z.enum(['baixo', 'medio', 'alto', 'critico'], { required_error: 'Nível de risco é obrigatório.' }),
    acaoCorretiva: z.string().min(1, 'Ação é obrigatória.'),
    responsavel: z.string().min(1, 'Responsável é obrigatório.'),
    prazo: z.date({ required_error: 'Prazo é obrigatório.' }),
});

const assinaturaSchema = z.object({
    nome: z.string(),
    data: z.date(),
}).nullable().optional();

const formSchema = z.object({
  numeroVistoria: z.string().min(1, "Número da vistoria é obrigatório"),
  dataVistoria: z.date({ required_error: 'Data é obrigatória.' }),
  horario: z.string().min(1, 'Horário é obrigatório.'),
  setor: z.string().min(1, "Setor é obrigatório."),
  atividade: z.string().min(1, "Atividade é obrigatória."),
  responsavelVistoria: z.string().min(1, "Responsável é obrigatório."),
  acompanhantes: z.string().optional(),
  checklist: z.record(z.object({
      status: z.enum(['c', 'nc', 'na'], { required_error: 'Selecione uma opção.' }),
  })),
  planoAcao: z.array(planoAcaoSchema).optional(),
  assinaturaResponsavelArea: assinaturaSchema,
});


const checklistItems = {
    'Riscos Físicos': [ 'Ruído: Fontes de ruído identificadas? Proteção auditiva disponível e em uso?', 'Calor/Frio: Ambiente com temperatura controlada? EPIs para condições térmicas extremas?', 'Vibrações: Equipamentos que geram vibração (mãos/braços, corpo inteiro) estão com manutenção em dia?', 'Radiações (Ionizantes/Não Ionizantes): Fontes de radiação isoladas? Sinalização adequada?'],
    'Riscos Químicos': [ 'Produtos Químicos: Armazenamento correto (longe de calor, ventilado)?', 'FISPQ/FDS: Ficha de Informação de Segurança de Produtos Químicos disponível e acessível a todos?', 'EPIs: Trabalhadores usam luvas, máscaras e óculos adequados para os produtos manuseados?', 'Ventilação: Sistema de exaustão/ventilação funcionando corretamente?'],
    'Riscos Biológicos': [ 'Materiais Contaminados: Descarte de resíduos (lixo hospitalar, etc.) feito em local apropriado?', 'Limpeza e Higienização: Procedimentos de limpeza sendo seguidos?', 'Controle de Pragas: Existe evidência de vetores (insetos, roedores)?'],
    'Riscos Ergonômicos': [ 'Postura: Mobiliário (cadeiras, mesas) ajustado ao trabalhador?', 'Levantamento de Peso: Técnicas corretas sendo aplicadas? Há auxílio de equipamentos?', 'Ritmo de Trabalho: Pausas para descanso estão sendo cumpridas?', 'Iluminação: Iluminação do posto de trabalho é adequada (nem fraca, nem ofuscante)?'],
    'Riscos de Acidentes (Mecânicos)': [ 'Máquinas e Equipamentos: Proteções de partes móveis (correias, polias) estão instaladas e intactas?', 'Instalações Elétricas: Fios expostos? Quadros elétricos sinalizados e desobstruídos?', 'Prevenção de Incêndio: Extintores dentro da validade, sinalizados e desobstruídos? Saídas de emergência livres?', 'Arranjo Físico (Layout): Corredores de circulação estão livres de obstáculos?', 'Trabalho em Altura: Uso de cinto de segurança, andaimes seguros, linha de vida?'],
};

const generateInitialChecklist = () => {
    return Object.values(checklistItems)
        .flat()
        .reduce((acc, item) => {
            acc[item] = { status: 'na' };
            return acc;
        }, {} as z.infer<typeof formSchema>['checklist']);
};

const generateDefaultValues = (service?: Service) => ({
    numeroVistoria: `VIST-${new Date().getFullYear()}-${String((service?.fichasPGR?.length || 0) + 1).padStart(3, '0')}`,
    dataVistoria: new Date(),
    horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    setor: '',
    atividade: '',
    responsavelVistoria: '',
    acompanhantes: '',
    checklist: generateInitialChecklist(),
    planoAcao: [],
    assinaturaResponsavelArea: null,
});

interface PgrFormProps {
    service: Service;
    onSave?: () => void;
    onCancel?: () => void;
    fichaToEdit?: FichaPGR;
    fichaIndex?: number;
}

export function PgrForm({ service, onSave, onCancel, fichaToEdit, fichaIndex }: PgrFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signerName, setSignerName] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: fichaToEdit ? {} : generateDefaultValues(service),
  });

  useEffect(() => {
      if (fichaToEdit) {
          const { dataPreenchimento, ...restOfFicha } = fichaToEdit;
          
          const planoAcaoWithDates = (restOfFicha.planoAcao || []).map(pa => ({
              ...pa,
              prazo: pa.prazo.seconds ? new Date(pa.prazo.seconds * 1000) : pa.prazo
          }));
          
          const assinatura = restOfFicha.assinaturaResponsavelArea
            ? { ...restOfFicha.assinaturaResponsavelArea, data: new Date((restOfFicha.assinaturaResponsavelArea.data as any).seconds * 1000) }
            : null;

          form.reset({
              ...restOfFicha,
              dataVistoria: restOfFicha.dataVistoria.seconds ? new Date(restOfFicha.dataVistoria.seconds * 1000) : restOfFicha.dataVistoria,
              planoAcao: planoAcaoWithDates,
              assinaturaResponsavelArea: assinatura,
          });
      } else {
          form.reset(generateDefaultValues(service));
      }
  }, [fichaToEdit, form, service]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "planoAcao",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const serviceRef = doc(db, 'servicos', service.id);
        
        if (fichaToEdit !== undefined && fichaIndex !== undefined) {
            const docSnap = await getDoc(serviceRef);
            if (docSnap.exists()) {
                const serviceData = docSnap.data() as Service;
                const fichas = [...(serviceData.fichasPGR || [])];
                
                const updatedFicha = {
                    ...fichas[fichaIndex],
                    ...values,
                };
                
                fichas[fichaIndex] = updatedFicha;

                await updateDoc(serviceRef, { fichasPGR: fichas });
                 toast({
                    title: 'Sucesso!',
                    description: 'Ficha PGR atualizada com sucesso.',
                    className: 'bg-accent text-accent-foreground',
                });
            }
        } else {
            const newFicha = {
                ...values,
                dataPreenchimento: new Date(),
            }
            await updateDoc(serviceRef, {
                fichasPGR: arrayUnion(newFicha)
            });
            toast({
                title: 'Sucesso!',
                description: 'Ficha PGR salva com sucesso.',
                className: 'bg-accent text-accent-foreground',
            });
        }
        
        form.reset(generateDefaultValues(service));
        onSave?.();

    } catch (error) {
        console.error('Error saving PGR form: ', error);
        toast({
            variant: 'destructive',
            title: 'Erro!',
            description: 'Não foi possível salvar a ficha PGR.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const handleSign = () => {
    if (signerName.trim()) {
        form.setValue('assinaturaResponsavelArea', {
            nome: signerName.trim(),
            data: new Date()
        });
        setIsSigning(false);
        setSignerName('');
    }
  }
  
  const assinatura = form.watch('assinaturaResponsavelArea');

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4">
        
        <Card>
            <CardHeader>
                <CardTitle>1. Identificação da Inspeção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     <FormField name="numeroVistoria" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Número da Vistoria</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                     )}/>
                     <FormField control={form.control} name="dataVistoria" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Data</FormLabel>
                        <CalendarPopover mode="single" selected={field.value} onSelect={field.onChange}>
                            <FormControl><Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl>
                        </CalendarPopover><FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="horario" render={({ field }) => (
                        <FormItem><FormLabel>Horário</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField name="setor" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Setor/Departamento</FormLabel><FormControl><Input placeholder="Ex: Oficina" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField name="atividade" control={form.control} render={({ field }) => (
                        <FormItem className="lg:col-span-2"><FormLabel>Atividade ou Equipamento</FormLabel><FormControl><Input placeholder="Ex: Operação de solda" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField name="responsavelVistoria" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Responsável pela Vistoria</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField name="acompanhantes" control={form.control} render={({ field }) => (
                        <FormItem className="lg:col-span-2"><FormLabel>Acompanhante(s)</FormLabel><FormControl><Input placeholder="Nomes dos acompanhantes" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>2. Checklist de Verificação de Riscos</CardTitle>
                <CardDescription>Legenda: C (Conforme), NC (Não Conforme), NA (Não se Aplica)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {Object.entries(checklistItems).map(([category, items]) => (
                    <div key={category}>
                        <h4 className="font-semibold text-md mb-4 border-b pb-2">{category}</h4>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <FormField key={item} control={form.control} name={`checklist.${item}`} render={({ field }) => (
                                   <div className="space-y-2 p-3 border rounded-md">
                                         <FormLabel className="text-sm font-medium">{item}</FormLabel>
                                         <FormControl>
                                            <RadioGroup onValueChange={(value) => field.onChange({ status: value })} value={field.value?.status || 'na'} className="flex space-x-4">
                                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="c" /></FormControl><FormLabel className="font-normal text-sm">C</FormLabel></FormItem>
                                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="nc" /></FormControl><FormLabel className="font-normal text-sm">NC</FormLabel></FormItem>
                                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="na" /></FormControl><FormLabel className="font-normal text-sm">NA</FormLabel></FormItem>
                                            </RadioGroup>
                                         </FormControl><FormMessage />
                                   </div>
                                )}/>
                            ))}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>3. Plano de Ação</CardTitle>
                <CardDescription>Adicione as não conformidades e ações corretivas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                        <h5 className="font-semibold">Plano de Ação {index + 1}</h5>
                         <FormField control={form.control} name={`planoAcao.${index}.descricaoNaoConformidade`} render={({ field }) => (
                            <FormItem><FormLabel>Descrição da Não Conformidade</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                         )}/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name={`planoAcao.${index}.registroFotografico`} render={({ field }) => (
                                <FormItem><FormLabel>Registro Fotográfico (ID/Link)</FormLabel><FormControl><Input placeholder="Ex: Foto 01" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name={`planoAcao.${index}.nivelRisco`} render={({ field }) => (
                                <FormItem><FormLabel>Nível de Risco</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o nível" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="baixo">Baixo</SelectItem>
                                        <SelectItem value="medio">Médio</SelectItem>
                                        <SelectItem value="alto">Alto</SelectItem>
                                        <SelectItem value="critico">Crítico</SelectItem>
                                    </SelectContent>
                                </Select><FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                        <FormField control={form.control} name={`planoAcao.${index}.acaoCorretiva`} render={({ field }) => (
                            <FormItem><FormLabel>Ação Corretiva Recomendada</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name={`planoAcao.${index}.responsavel`} render={({ field }) => (
                                <FormItem><FormLabel>Responsável pela Execução</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name={`planoAcao.${index}.prazo`} render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>Prazo</FormLabel>
                                    <CalendarPopover mode="single" selected={field.value} onSelect={field.onChange}>
                                        <FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                            {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha um prazo</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button></FormControl>
                                    </CalendarPopover><FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                         <Button type="button" variant="destructive" size="icon" className="absolute top-4 right-4" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ descricaoNaoConformidade: '', nivelRisco: 'baixo', acaoCorretiva: '', responsavel: '', prazo: new Date() })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Ação Corretiva
                </Button>
            </CardContent>
        </Card>

        <Card>
             <CardHeader><CardTitle>4. Assinaturas</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                 <div className="flex flex-col items-center">
                    <Separator className="bg-foreground" />
                    <p className="mt-2 text-sm font-semibold">Assinatura do Responsável pela Vistoria</p>
                    <p className="text-sm text-muted-foreground">{form.getValues('responsavelVistoria')}</p>
                </div>
                 <div className="flex flex-col items-center">
                    {assinatura ? (
                        <div className='text-center'>
                            <p className='font-serif text-lg'>{assinatura.nome}</p>
                            <Separator className="bg-foreground" />
                            <p className="mt-2 text-sm font-semibold">Assinatura do Responsável pelo Setor/Área</p>
                            <p className="text-xs text-muted-foreground">
                                Assinado digitalmente em {format(assinatura.data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                             <Button variant="link" size="sm" onClick={() => form.setValue('assinaturaResponsavelArea', null)}>Remover assinatura</Button>
                        </div>
                    ) : (
                        <Button type="button" onClick={() => setIsSigning(true)}>
                            <Signature className="mr-2 h-4 w-4" />
                            Assinar como Responsável da Área
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
        
        <div className="flex justify-end gap-2">
          {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
          <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
            {isSubmitting ? 'Salvando...' : (fichaToEdit ? 'Salvar Alterações' : 'Salvar Ficha PGR')}
          </Button>
        </div>
      </form>
    </Form>
     <AlertDialog open={isSigning} onOpenChange={setIsSigning}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Assinatura Digital</AlertDialogTitle>
            <AlertDialogDescription>
                Digite o nome completo do responsável da área para confirmar a vistoria. Isso registrará o nome e a data/hora atuais.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <Input 
                placeholder="Nome completo do responsável"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
            />
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSign} disabled={!signerName.trim()}>Assinar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
