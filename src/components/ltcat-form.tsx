
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FichaLTCAT, Service } from '@/app/(main)/engenharia/page';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { CalendarIcon, PlusCircle, Signature, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { useEffect, useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

const agenteFisicoSchema = z.object({
    agente: z.string().optional(),
    fonteGeradora: z.string().optional(),
    instrumento: z.string().optional(),
    numeroSerie: z.string().optional(),
    resultado: z.string().optional(),
    limiteTolerancia: z.string().optional(),
    metodologia: z.string().optional(),
    conclusao: z.string().optional(),
});

const agenteQuimicoSchema = z.object({
    agente: z.string().optional(),
    fonteGeradora: z.string().optional(),
    tipoAmostra: z.string().optional(),
    tempoColeta: z.string().optional(),
    resultado: z.string().optional(),
    limiteTolerancia: z.string().optional(),
    metodologia: z.string().optional(),
    conclusao: z.string().optional(),
});

const agenteBiologicoSchema = z.object({
    descricao: z.string().optional(),
    agenteProvavel: z.string().optional(),
    enquadramento: z.boolean().optional(),
});

const assinaturaSchema = z.object({
    nome: z.string(),
    data: z.date(),
}).nullable().optional();


const formSchema = z.object({
    cnae: z.string().min(1, 'CNAE é obrigatório'),
    dataVistoria: z.date({ required_error: 'Data é obrigatória.' }),
    horario: z.string().min(1, 'Horário é obrigatório.'),
    responsavelVistoria: z.string().min(1, 'Responsável é obrigatório.'),
    acompanhante: z.string().min(1, 'Acompanhante é obrigatório.'),
    setor: z.string().min(1, 'Setor é obrigatório.'),
    ghe: z.string().min(1, 'GHE é obrigatório.'),
    funcoes: z.string().min(1, 'Funções são obrigatórias.'),
    totalTrabalhadores: z.coerce.number().min(0, 'Inválido'),
    homens: z.coerce.number().min(0, 'Inválido'),
    mulheres: z.coerce.number().min(0, 'Inválido'),
    descricaoAtividades: z.string().min(1, 'Descrição é obrigatória.'),
    jornadaTrabalho: z.string().min(1, 'Jornada é obrigatória.'),
    frequenciaExposicao: z.enum(['continua', 'intermitente'], { required_error: 'Selecione a frequência.' }),
    arranjoFisico: z.string().min(1, 'Arranjo físico é obrigatório.'),
    equipamentos: z.string().min(1, 'Equipamentos são obrigatórios.'),
    agentesFisicos: z.array(agenteFisicoSchema).optional(),
    agentesQuimicos: z.array(agenteQuimicoSchema).optional(),
    agentesBiologicos: z.array(agenteBiologicoSchema).optional(),
    epcs: z.array(z.string()).optional(),
    epcsOutros: z.string().optional(),
    epcsEficaz: z.enum(['sim', 'nao', 'parcialmente'], { required_error: 'Selecione a eficácia.' }),
    epis: z.array(z.string()).optional(),
    episOutros: z.string().optional(),
    episEficaz: z.enum(['sim', 'nao', 'na'], { required_error: 'Selecione a eficácia.' }),
    observacoes: z.string().optional(),
    fotos: z.array(z.string()).optional(),
    assinaturaResponsavelArea: assinaturaSchema,
});


const epcsList = [
    { id: "enclausuramento", label: "Enclausuramento de fontes de ruído" },
    { id: "sistemas_exaustao", label: "Sistemas de exaustão/ventilação" },
    { id: "barreiras_radiacao", label: "Barreiras de proteção contra radiação" },
];

const episList = [
    { id: "protetor_auricular", label: "Protetor auricular" },
    { id: "luvas", label: "Luvas de proteção" },
    { id: "respirador", label: "Respirador/Máscara" },
    { id: "oculos", label: "Óculos de proteção" },
];

const generateDefaultValues = (service: Service) => ({
    cnae: '',
    dataVistoria: new Date(),
    horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    responsavelVistoria: service.tecnico || '',
    acompanhante: '',
    setor: '',
    ghe: '',
    funcoes: '',
    totalTrabalhadores: 0,
    homens: 0,
    mulheres: 0,
    descricaoAtividades: '',
    jornadaTrabalho: '',
    frequenciaExposicao: 'continua' as const,
    arranjoFisico: '',
    equipamentos: '',
    agentesFisicos: [],
    agentesQuimicos: [],
    agentesBiologicos: [],
    epcs: [],
    epcsOutros: '',
    epcsEficaz: 'nao' as const,
    epis: [],
    episOutros: '',
    episEficaz: 'nao' as const,
    observacoes: '',
    fotos: [],
    assinaturaResponsavelArea: null,
});

interface LtcatFormProps {
    service: Service;
    onSave?: () => void;
    onCancel?: () => void;
    fichaToEdit?: FichaLTCAT;
    fichaIndex?: number;
}

export function LtcatForm({ service, onSave, onCancel, fichaToEdit, fichaIndex }: LtcatFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [signerName, setSignerName] = useState('');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: fichaToEdit ? {} : generateDefaultValues(service),
    });
    
    const { fields: agentesFisicosFields, append: appendAgenteFisico, remove: removeAgenteFisico } = useFieldArray({
        control: form.control,
        name: "agentesFisicos",
    });

    const { fields: agentesQuimicosFields, append: appendAgenteQuimico, remove: removeAgenteQuimico } = useFieldArray({
        control: form.control,
        name: "agentesQuimicos",
    });

    const { fields: agentesBiologicosFields, append: appendAgenteBiologico, remove: removeAgenteBiologico } = useFieldArray({
        control: form.control,
        name: "agentesBiologicos",
    });

    useEffect(() => {
        if (fichaToEdit) {
            const assinatura = fichaToEdit.assinaturaResponsavelArea 
                ? { ...fichaToEdit.assinaturaResponsavelArea, data: new Date((fichaToEdit.assinaturaResponsavelArea.data as any).seconds * 1000) }
                : null;
            form.reset({
                ...fichaToEdit,
                dataVistoria: fichaToEdit.dataVistoria?.seconds ? new Date(fichaToEdit.dataVistoria.seconds * 1000) : new Date(),
                agentesFisicos: fichaToEdit.agentesFisicos || [],
                assinaturaResponsavelArea: assinatura,
            });
        } else {
            form.reset(generateDefaultValues(service));
        }
    }, [fichaToEdit, form, service]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const serviceRef = doc(db, 'servicos', service.id);

            const dataToSave = {
                ...values,
                dataPreenchimento: new Date(),
            }

            if (fichaToEdit !== undefined && fichaIndex !== undefined) {
                const docSnap = await getDoc(serviceRef);
                if (docSnap.exists()) {
                    const serviceData = docSnap.data() as Service;
                    const fichas = [...(serviceData.fichasLTCAT || [])];
                    fichas[fichaIndex] = dataToSave;
                    await updateDoc(serviceRef, { fichasLTCAT: fichas });
                    toast({
                        title: 'Sucesso!',
                        description: 'Ficha LTCAT atualizada com sucesso.',
                        className: 'bg-accent text-accent-foreground',
                    });
                }
            } else {
                await updateDoc(serviceRef, {
                    fichasLTCAT: arrayUnion(dataToSave)
                });
                toast({
                    title: 'Sucesso!',
                    description: 'Ficha LTCAT salva com sucesso.',
                    className: 'bg-accent text-accent-foreground',
                });
            }

            form.reset(generateDefaultValues(service));
            onSave?.();

        } catch (error) {
            console.error('Error saving LTCAT form: ', error);
            toast({
                variant: 'destructive',
                title: 'Erro!',
                description: 'Não foi possível salvar a ficha LTCAT.',
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
                        <CardTitle>1. Dados Gerais da Avaliação</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormItem><FormLabel>Empresa</FormLabel><Input value={service.nomeEmpresa} disabled /></FormItem>
                        <FormItem><FormLabel>CNPJ</FormLabel><Input value={service.cnpj} disabled /></FormItem>
                        <FormField name="cnae" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>CNAE</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormItem className="col-span-1 lg:col-span-3"><FormLabel>Endereço</FormLabel><Input value={`${service.endereco}, ${service.bairro} - ${service.cidade}`} disabled /></FormItem>
                        
                         <FormField control={form.control} name="dataVistoria" render={({ field }) => (
                            <FormItem className="flex flex-col"><FormLabel>Data da Vistoria</FormLabel>
                                <Popover><PopoverTrigger asChild>
                                    <FormControl><Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                        {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button></FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                                </Popover><FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="horario" render={({ field }) => (
                            <FormItem><FormLabel>Horário</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="responsavelVistoria" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Responsável pela Vistoria</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="acompanhante" control={form.control} render={({ field }) => (
                            <FormItem className="lg:col-span-2"><FormLabel>Responsável da Empresa (Acompanhante)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>2. Caracterização do Ambiente e da Função</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField name="setor" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Setor/Departamento Avaliado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="ghe" control={form.control} render={({ field }) => (
                             <FormItem className="lg:col-span-2"><FormLabel>GHE (Grupo Homogêneo de Exposição)</FormLabel><FormControl><Input placeholder="Ex: Operadores de Torno Mecânico" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="funcoes" control={form.control} render={({ field }) => (
                             <FormItem className="lg:col-span-3"><FormLabel>Função(ões) Analisada(s) no GHE</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="homens" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>N° de Homens</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField name="mulheres" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>N° de Mulheres</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField name="totalTrabalhadores" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Total</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField name="descricaoAtividades" control={form.control} render={({ field }) => (
                             <FormItem className="lg:col-span-3"><FormLabel>Descrição Detalhada das Atividades</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField name="jornadaTrabalho" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Jornada de Trabalho</FormLabel><FormControl><Input placeholder="Ex: 8 horas/dia" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="frequenciaExposicao" control={form.control} render={({ field }) => (
                            <FormItem className="space-y-3"><FormLabel>Frequência de Exposição</FormLabel><FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="continua" /></FormControl><FormLabel className="font-normal">Contínua</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="intermitente" /></FormControl><FormLabel className="font-normal">Intermitente</FormLabel></FormItem>
                                </RadioGroup></FormControl><FormMessage />
                            </FormItem>
                        )} />
                         <FormField name="arranjoFisico" control={form.control} render={({ field }) => (
                             <FormItem className="lg:col-span-3"><FormLabel>Arranjo Físico (Layout)</FormLabel><FormControl><Textarea placeholder="Breve descrição do ambiente..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField name="equipamentos" control={form.control} render={({ field }) => (
                             <FormItem className="lg:col-span-3"><FormLabel>Equipamentos/Máquinas Utilizadas</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>3. Avaliação Quantitativa de Agentes Nocivos</CardTitle>
                        <CardDescription>Preencha apenas os campos aplicáveis ao ambiente vistoriado.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Agentes Físicos */}
                        <div>
                            <h4 className="font-semibold text-md mb-4 border-b pb-2">A. Agentes Físicos</h4>
                            <div className="space-y-4">
                                {agentesFisicosFields.map((field, index) => (
                                    <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                                        <h5 className="font-semibold">Agente Físico {index + 1}</h5>
                                         <FormField name={`agentesFisicos.${index}.agente`} control={form.control} render={({ field }) => (
                                            <FormItem><FormLabel>Agente</FormLabel><FormControl><Input placeholder="Ex: Ruído Contínuo" {...field} /></FormControl></FormItem>
                                        )} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <FormField name={`agentesFisicos.${index}.fonteGeradora`} control={form.control} render={({ field }) => (
                                                <FormItem><FormLabel>Fonte Geradora</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                            )} />
                                            <FormField name={`agentesFisicos.${index}.instrumento`} control={form.control} render={({ field }) => (
                                                <FormItem><FormLabel>Instrumento de Medição</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                            )} />
                                            <FormField name={`agentesFisicos.${index}.numeroSerie`} control={form.control} render={({ field }) => (
                                                <FormItem><FormLabel>N° de Série</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                            )} />
                                            <FormField name={`agentesFisicos.${index}.resultado`} control={form.control} render={({ field }) => (
                                                <FormItem><FormLabel>Resultado (Medição)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                            )} />
                                        </div>
                                         <Button type="button" variant="destructive" size="icon" className="absolute top-4 right-4" onClick={() => removeAgenteFisico(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => appendAgenteFisico({})}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Agente Físico
                            </Button>
                        </div>

                        {/* Agentes Químicos */}
                        <div>
                            <h4 className="font-semibold text-md mb-4 border-b pb-2">B. Agentes Químicos</h4>
                             {agentesQuimicosFields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-md space-y-4 relative mb-4">
                                    <h5 className="font-semibold">Agente Químico {index + 1}</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <FormField control={form.control} name={`agentesQuimicos.${index}.agente`} render={({ field }) => (
                                            <FormItem><FormLabel>Agente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`agentesQuimicos.${index}.fonteGeradora`} render={({ field }) => (
                                            <FormItem><FormLabel>Fonte Geradora</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`agentesQuimicos.${index}.tipoAmostra`} render={({ field }) => (
                                            <FormItem><FormLabel>Tipo de Amostra</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`agentesQuimicos.${index}.tempoColeta`} render={({ field }) => (
                                            <FormItem><FormLabel>Tempo de Coleta</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`agentesQuimicos.${index}.resultado`} render={({ field }) => (
                                            <FormItem><FormLabel>Resultado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`agentesQuimicos.${index}.limiteTolerancia`} render={({ field }) => (
                                            <FormItem><FormLabel>Limite de Tolerância</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`agentesQuimicos.${index}.metodologia`} render={({ field }) => (
                                            <FormItem><FormLabel>Metodologia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`agentesQuimicos.${index}.conclusao`} render={({ field }) => (
                                            <FormItem><FormLabel>Conclusão</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-4 right-4" onClick={() => removeAgenteQuimico(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => appendAgenteQuimico({})}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Agente Químico
                            </Button>
                        </div>
                        
                        {/* Agentes Biológicos */}
                        <div>
                             <h4 className="font-semibold text-md mb-4 border-b pb-2">C. Agentes Biológicos (Qualitativo)</h4>
                              {agentesBiologicosFields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-md space-y-4 relative mb-4">
                                     <h5 className="font-semibold">Agente Biológico {index + 1}</h5>
                                     <FormField control={form.control} name={`agentesBiologicos.${index}.descricao`} render={({ field }) => (
                                        <FormItem><FormLabel>Descrição da Atividade com Exposição Potencial</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                     )}/>
                                      <FormField control={form.control} name={`agentesBiologicos.${index}.agenteProvavel`} render={({ field }) => (
                                        <FormItem><FormLabel>Agente Biológico Provável</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                     )}/>
                                     <FormField control={form.control} name={`agentesBiologicos.${index}.enquadramento`} render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5">
                                            <FormLabel className="text-base">Enquadramento (Anexo 14, NR-15)</FormLabel>
                                            </div><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                     )}/>
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-4 right-4" onClick={() => removeAgenteBiologico(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => appendAgenteBiologico({})}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Agente Biológico
                            </Button>
                        </div>

                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>4. Medidas de Controle Existentes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <div>
                            <FormField name="epcs" control={form.control} render={() => (
                                <FormItem>
                                    <div className="mb-4"><FormLabel className="text-base">EPCs (Equipamentos de Proteção Coletiva)</FormLabel></div>
                                    {epcsList.map((item) => (
                                        <FormField key={item.id} control={form.control} name="epcs" render={({ field }) => (
                                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl><Checkbox
                                                    checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                        return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id));
                                                    }} /></FormControl>
                                                <FormLabel className="font-normal">{item.label}</FormLabel>
                                            </FormItem>
                                        )} />
                                    ))}
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField name="epcsOutros" control={form.control} render={({ field }) => (
                                <FormItem className="mt-2"><FormLabel>Outros EPCs</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="epcsEficaz" render={({ field }) => (
                                <FormItem className="space-y-3 mt-2"><FormLabel>Eficácia dos EPCs</FormLabel><FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="sim" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="nao" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="parcialmente" /></FormControl><FormLabel className="font-normal">Parcialmente</FormLabel></FormItem>
                                    </RadioGroup></FormControl><FormMessage />
                                </FormItem>
                            )} />
                       </div>
                        <Separator />
                       <div>
                            <FormField name="epis" control={form.control} render={() => (
                                <FormItem>
                                    <div className="mb-4"><FormLabel className="text-base">EPIs (Equipamentos de Proteção Individual)</FormLabel></div>
                                    {epcsList.map((item) => (
                                        <FormField key={item.id} control={form.control} name="epis" render={({ field }) => (
                                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl><Checkbox
                                                    checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                        return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id));
                                                    }} /></FormControl>
                                                <FormLabel className="font-normal">{item.label}</FormLabel>
                                            </FormItem>
                                        )} />
                                    ))}
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField name="episOutros" control={form.control} render={({ field }) => (
                                <FormItem className="mt-2"><FormLabel>Outros EPIs (com CA)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="episEficaz" render={({ field }) => (
                                <FormItem className="space-y-3 mt-2"><FormLabel>Eficácia dos EPIs</FormLabel><FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="sim" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="nao" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="na" /></FormControl><FormLabel className="font-normal">Não se aplica</FormLabel></FormItem>
                                    </RadioGroup></FormControl><FormMessage />
                                </FormItem>
                            )} />
                       </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle>5. Observações e Registro Fotográfico</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormField name="observacoes" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Observações Adicionais</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        {/* TODO: Implementar upload de fotos */}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>6. Assinaturas</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                         <div className="flex flex-col items-center">
                            <Separator className="bg-foreground" />
                            <p className="mt-2 text-sm font-semibold">Técnico/Engenheiro Responsável</p>
                            <p className="text-sm text-muted-foreground">{form.getValues('responsavelVistoria')}</p>
                        </div>
                        <div className="flex flex-col items-center">
                            {assinatura ? (
                                <div className='text-center'>
                                    <p className='font-serif text-lg'>{assinatura.nome}</p>
                                    <Separator className="bg-foreground" />
                                    <p className="mt-2 text-sm font-semibold">Responsável da Empresa</p>
                                    <p className="text-xs text-muted-foreground">
                                        Assinado digitalmente em {format(assinatura.data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                     <Button variant="link" size="sm" onClick={() => form.setValue('assinaturaResponsavelArea', null)}>Remover assinatura</Button>
                                </div>
                            ) : (
                                <Button type="button" onClick={() => setIsSigning(true)}>
                                    <Signature className="mr-2 h-4 w-4" />
                                    Assinar como Responsável da Empresa
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
                    <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
                        {isSubmitting ? 'Salvando...' : (fichaToEdit ? 'Salvar Alterações' : 'Salvar Ficha LTCAT')}
                    </Button>
                </div>
            </form>
        </Form>
        <AlertDialog open={isSigning} onOpenChange={setIsSigning}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Assinatura Digital</AlertDialogTitle>
                <AlertDialogDescription>
                    Digite o nome completo do responsável da empresa para confirmar a vistoria. Isso registrará o nome e a data/hora atuais.
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
