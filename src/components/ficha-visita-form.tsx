
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AgenteBiologico, AgenteFisico, AgenteQuimico, Assinatura, FichaVisita, PgrAcaoCorretiva, Service } from '@/app/(main)/engenharia/page';
import { Textarea } from './ui/textarea';
import { useAuth } from '@/context/auth-context';
import { Input } from './ui/input';
import { CalendarIcon, PlusCircle, Signature, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarPopover } from './ui/calendar';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Separator } from './ui/separator';
import { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Schemas para as seções unificadas
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

const assinaturaSchema = z.object({
    nome: z.string(),
    data: z.date(),
}).nullable().optional();

// Schemas PGR
const planoAcaoSchema = z.object({
    descricaoNaoConformidade: z.string().min(1, 'Descrição é obrigatória.'),
    registroFotografico: z.string().optional(),
    nivelRisco: z.enum(['baixo', 'medio', 'alto', 'critico'], { required_error: 'Nível de risco é obrigatório.' }),
    acaoCorretiva: z.string().min(1, 'Ação é obrigatória.'),
    responsavel: z.string().min(1, 'Responsável é obrigatório.'),
    prazo: z.date({ required_error: 'Prazo é obrigatório.' }),
});

const pgrSchema = z.object({
    preencher: z.boolean().default(false),
    numeroVistoria: z.string().optional(),
    atividade: z.string().optional(),
    responsavelVistoria: z.string().optional(),
    acompanhantes: z.string().optional(),
    checklist: z.record(z.object({ status: z.enum(['c', 'nc', 'na']) })).optional(),
    planoAcao: z.array(planoAcaoSchema).optional(),
    assinaturaResponsavelArea: assinaturaSchema,
}).optional();


// Schemas LTCAT
const agenteFisicoSchema = z.object({
    agente: z.string().optional(), fonteGeradora: z.string().optional(), instrumento: z.string().optional(), numeroSerie: z.string().optional(), resultado: z.string().optional(), limiteTolerancia: z.string().optional(), metodologia: z.string().optional(), conclusao: z.string().optional(),
});
const agenteQuimicoSchema = z.object({
    agente: z.string().optional(), fonteGeradora: z.string().optional(), tipoAmostra: z.string().optional(), tempoColeta: z.string().optional(), resultado: z.string().optional(), limiteTolerancia: z.string().optional(), metodologia: z.string().optional(), conclusao: z.string().optional(),
});
const agenteBiologicoSchema = z.object({
    descricao: z.string().optional(), agenteProvavel: z.string().optional(), enquadramento: z.boolean().optional(),
});

const ltcatSchema = z.object({
    preencher: z.boolean().default(false),
    cnae: z.string().optional(),
    responsavelVistoria: z.string().optional(),
    setor: z.string().optional(),
    ghe: z.string().optional(),
    funcoes: z.string().optional(),
    totalTrabalhadores: z.coerce.number().optional(),
    homens: z.coerce.number().optional(),
    mulheres: z.coerce.number().optional(),
    descricaoAtividades: z.string().optional(),
    jornadaTrabalho: z.string().optional(),
    frequenciaExposicao: z.enum(['continua', 'intermitente']).optional(),
    arranjoFisico: z.string().optional(),
    equipamentos: z.string().optional(),
    agentesFisicos: z.array(agenteFisicoSchema).optional(),
    agentesQuimicos: z.array(agenteQuimicoSchema).optional(),
    agentesBiologicos: z.array(agenteBiologicoSchema).optional(),
    epcs: z.array(z.string()).optional(),
    epcsOutros: z.string().optional(),
    epcsEficaz: z.enum(['sim', 'nao', 'parcialmente']).optional(),
    epis: z.array(z.string()).optional(),
    episOutros: z.string().optional(),
    episEficaz: z.enum(['sim', 'nao', 'na']).optional(),
    observacoes: z.string().optional(),
    fotos: z.array(z.string()).optional(),
    assinaturaResponsavelArea: assinaturaSchema,
}).optional();

// Schema principal do formulário
const formSchema = z.object({
  setorInspecionado: z.string().min(1, 'Setor é obrigatório.'),
  dataVistoria: z.date({ required_error: 'Data é obrigatória.' }),
  horario: z.string().min(1, 'Horário é obrigatório.'),
  acompanhante: z.string().min(1, 'Acompanhante é obrigatório.'),
  tipoInspecao: z.enum(['rotina', 'denuncia', 'especifica', 'oficial'], { required_error: 'Selecione o tipo de inspeção.' }),
  itensVerificacao: z.record(itemVerificacaoSchema),
  naoConformidades: z.array(naoConformidadeSchema).optional(),
  assinaturaResponsavelArea: assinaturaSchema,
  pgr: pgrSchema,
  ltcat: ltcatSchema,
});


// Listas de Itens e Valores Padrão
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
const checklistItemsPGR = {
    'Riscos Físicos': [ 'Ruído: Fontes de ruído identificadas? Proteção auditiva disponível e em uso?', 'Calor/Frio: Ambiente com temperatura controlada? EPIs para condições térmicas extremas?', 'Vibrações: Equipamentos que geram vibração (mãos/braços, corpo inteiro) estão com manutenção em dia?', 'Radiações (Ionizantes/Não Ionizantes): Fontes de radiação isoladas? Sinalização adequada?'],
    'Riscos Químicos': [ 'Produtos Químicos: Armazenamento correto (longe de calor, ventilado)?', 'FISPQ/FDS: Ficha de Informação de Segurança de Produtos Químicos disponível e acessível a todos?', 'EPIs: Trabalhadores usam luvas, máscaras e óculos adequados para os produtos manuseados?', 'Ventilação: Sistema de exaustão/ventilação funcionando corretamente?'],
    'Riscos Biológicos': [ 'Materiais Contaminados: Descarte de resíduos (lixo hospitalar, etc.) feito em local apropriado?', 'Limpeza e Higienização: Procedimentos de limpeza sendo seguidos?', 'Controle de Pragas: Existe evidência de vetores (insetos, roedores)?'],
    'Riscos Ergonômicos': [ 'Postura: Mobiliário (cadeiras, mesas) ajustado ao trabalhador?', 'Levantamento de Peso: Técnicas corretas sendo aplicadas? Há auxílio de equipamentos?', 'Ritmo de Trabalho: Pausas para descanso estão sendo cumpridas?', 'Iluminação: Iluminação do posto de trabalho é adequada (nem fraca, nem ofuscante)?'],
    'Riscos de Acidentes (Mecânicos)': [ 'Máquinas e Equipamentos: Proteções de partes móveis (correias, polias) estão instaladas e intactas?', 'Instalações Elétricas: Fios expostos? Quadros elétricos sinalizados e desobstruídos?', 'Prevenção de Incêndio: Extintores dentro da validade, sinalizados e desobstruídos? Saídas de emergência livres?', 'Arranjo Físico (Layout): Corredores de circulação estão livres de obstáculos?', 'Trabalho em Altura: Uso de cinto de segurança, andaimes seguros, linha de vida?'],
};
const epcsList = ["Enclausuramento acústico", "Ventilação local exaustora", "Proteção de partes móveis", "Corrimão", "Guarda-corpo e rodapé"];
const episList = ["Capacete", "Óculos de segurança", "Protetor facial", "Protetor auricular", "Respirador", "Luvas de segurança", "Mangas de proteção", "Calçados de segurança", "Cinturão de segurança"];

const generateInitialItensVerificacao = () => Object.values(checklistItems).flat().reduce((acc, item) => ({ ...acc, [item]: { status: 'na', observacoes: '' } }), {});
const generateInitialChecklistPGR = () => Object.values(checklistItemsPGR).flat().reduce((acc, item) => ({ ...acc, [item]: { status: 'na' } }), {});

const generateDefaultValues = (service: Service | null) => ({
    setorInspecionado: '',
    dataVistoria: new Date(),
    horario: new Date().toTimeString().slice(0, 5),
    acompanhante: '',
    tipoInspecao: 'rotina' as const,
    itensVerificacao: generateInitialItensVerificacao(),
    naoConformidades: [],
    assinaturaResponsavelArea: null,
    pgr: {
        preencher: false,
        numeroVistoria: '',
        atividade: '',
        responsavelVistoria: service?.tecnico || '',
        acompanhantes: '',
        checklist: generateInitialChecklistPGR(),
        planoAcao: [],
        assinaturaResponsavelArea: null,
    },
    ltcat: {
        preencher: false,
        cnae: '',
        responsavelVistoria: service?.tecnico || '',
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
        episEficaz: 'na' as const,
        observacoes: '',
        fotos: [],
        assinaturaResponsavelArea: null,
    }
});


interface FichaVisitaFormProps {
    service: Service;
    onSave?: () => void;
    onCancel?: () => void;
    fichaToEdit?: FichaVisita;
    fichaIndex?: number;
}

export function FichaVisitaForm({ service, onSave, onCancel, fichaToEdit, fichaIndex }: FichaVisitaFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureFor, setSignatureFor] = useState<'responsavel' | 'pgr' | 'ltcat' | null>(null);
  const [signatureName, setSignatureName] = useState('');

  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { fields: ncFields, append: appendNc, remove: removeNc } = useFieldArray({ control: form.control, name: "naoConformidades" });
  const { fields: paFields, append: appendPa, remove: removePa } = useFieldArray({ control: form.control, name: "pgr.planoAcao" });
  const { fields: afFields, append: appendAf, remove: removeAf } = useFieldArray({ control: form.control, name: "ltcat.agentesFisicos" });
  const { fields: aqFields, append: appendAq, remove: removeAq } = useFieldArray({ control: form.control, name: "ltcat.agentesQuimicos" });
  const { fields: abFields, append: appendAb, remove: removeAb } = useFieldArray({ control: form.control, name: "ltcat.agentesBiologicos" });

  useEffect(() => {
    if (fichaToEdit) {
      // Logic to populate form with existing data
      const defaultData = generateDefaultValues(service);
      
      const pgrData = fichaToEdit.pgr ? {
          ...fichaToEdit.pgr,
          preencher: true,
          planoAcao: (fichaToEdit.pgr.planoAcao || []).map(pa => ({ ...pa, prazo: new Date((pa.prazo as any).seconds * 1000) })),
          assinaturaResponsavelArea: fichaToEdit.pgr.assinaturaResponsavelArea ? { ...fichaToEdit.pgr.assinaturaResponsavelArea, data: new Date((fichaToEdit.pgr.assinaturaResponsavelArea.data as any).seconds * 1000) } : null,
      } : defaultData.pgr;

      const ltcatData = fichaToEdit.ltcat ? {
        ...fichaToEdit.ltcat,
        preencher: true,
        assinaturaResponsavelArea: fichaToEdit.ltcat.assinaturaResponsavelArea ? { ...fichaToEdit.ltcat.assinaturaResponsavelArea, data: new Date((fichaToEdit.ltcat.assinaturaResponsavelArea.data as any).seconds * 1000) } : null,
      } : defaultData.ltcat;

      form.reset({
        ...fichaToEdit,
        dataVistoria: new Date(fichaToEdit.dataVistoria.seconds * 1000),
        naoConformidades: (fichaToEdit.naoConformidades || []).map(nc => ({...nc, prazo: new Date((nc.prazo as any).seconds * 1000)})),
        assinaturaResponsavelArea: fichaToEdit.assinaturaResponsavelArea ? { ...fichaToEdit.assinaturaResponsavelArea, data: new Date((fichaToEdit.assinaturaResponsavelArea.data as any).seconds * 1000) } : null,
        pgr: pgrData,
        ltcat: ltcatData,
      });
    } else {
      form.reset(generateDefaultValues(service));
    }
  }, [fichaToEdit, form, service]);


  const handleSign = () => {
    if (signatureName && signatureFor) {
        const signature = { nome: signatureName, data: new Date() };
        if (signatureFor === 'responsavel') form.setValue('assinaturaResponsavelArea', signature);
        if (signatureFor === 'pgr') form.setValue('pgr.assinaturaResponsavelArea', signature);
        if (signatureFor === 'ltcat') form.setValue('ltcat.assinaturaResponsavelArea', signature);
        setSignatureFor(null);
        setSignatureName('');
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const serviceRef = doc(db, 'servicos', service.id);

        const dataToSave: Partial<FichaVisita> = {
            ...values,
            pgr: values.pgr?.preencher ? values.pgr : undefined,
            ltcat: values.ltcat?.preencher ? values.ltcat : undefined,
            dataPreenchimento: new Date(),
            tecnico: service.tecnico || user?.displayName || 'Não identificado',
        };
        
        // remove preencher flags
        if (dataToSave.pgr) delete (dataToSave.pgr as any).preencher;
        if (dataToSave.ltcat) delete (dataToSave.ltcat as any).preencher;


        let currentServiceDoc = await getDoc(serviceRef);
        if (!currentServiceDoc.exists()) {
             throw new Error("Serviço não encontrado");
        }
        let currentFichas = currentServiceDoc.data().fichasVisita || [];

        if (typeof fichaIndex === 'number' && fichaIndex >= 0) {
            // Edit existing ficha
            currentFichas[fichaIndex] = dataToSave;
        } else {
            // Add new ficha
            currentFichas.push(dataToSave);
        }

        await updateDoc(serviceRef, { fichasVisita: currentFichas });

        toast({
            title: 'Sucesso!',
            description: `Ficha de visita ${typeof fichaIndex === 'number' ? 'atualizada' : 'salva'} com sucesso.`,
            className: 'bg-accent text-accent-foreground',
        });
        onSave?.();
    } catch (error) {
        console.error('Error saving document: ', error);
        toast({
            variant: 'destructive',
            title: 'Erro!',
            description: 'Não foi possível salvar a ficha de visita.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const { pgr: pgrValues, ltcat: ltcatValues } = form.watch();

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4">
            
            {/* Seção Ficha de Visita Base */}
            <Card>
                <CardHeader>
                    <CardTitle>Ficha de Inspeção de Segurança</CardTitle>
                    <CardDescription>Preencha os dados da inspeção realizada.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField control={form.control} name="setorInspecionado" render={({ field }) => ( <FormItem><FormLabel>Setor Inspecionado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="dataVistoria" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Data da Vistoria</FormLabel><CalendarPopover mode="single" selected={field.value} onSelect={field.onChange}><FormControl><Button variant={'outline'} className={cn('w-full justify-start text-left font-normal',!field.value && 'text-muted-foreground')}>{field.value ? (format(field.value, 'PPP', { locale: ptBR })) : (<span>Escolha a data</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></CalendarPopover><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="horario" render={({ field }) => ( <FormItem><FormLabel>Horário</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="acompanhante" render={({ field }) => ( <FormItem><FormLabel>Acompanhante(s)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="tipoInspecao" render={({ field }) => (
                        <FormItem className="space-y-3 lg:col-span-2"><FormLabel>Tipo de Inspeção</FormLabel>
                            <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="rotina" /></FormControl><FormLabel className="font-normal">Rotina</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="denuncia" /></FormControl><FormLabel className="font-normal">Denúncia</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="especifica" /></FormControl><FormLabel className="font-normal">Específica</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="oficial" /></FormControl><FormLabel className="font-normal">Oficial</FormLabel></FormItem>
                            </RadioGroup>
                            </FormControl><FormMessage />
                        </FormItem>)}/>
                    </div>
                    
                    <Separator />
                    
                    <div>
                        <h3 className="text-lg font-medium mb-4">Checklist de Verificação</h3>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {Object.entries(checklistItems).map(([category, items]) => (
                            <div key={category}>
                                <h4 className="font-semibold mb-2">{category}</h4>
                                <div className="space-y-3">
                                {items.map((item) => (
                                    <FormField key={item} control={form.control} name={`itensVerificacao.${item}`} render={({ field }) => (
                                        <FormItem className="space-y-2 p-3 border rounded-md">
                                            <FormLabel className="text-sm font-normal">{item}</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={(value) => field.onChange({ ...field.value, status: value })} value={field.value?.status || 'na'} className="flex space-x-4">
                                                    <div className="flex items-center space-x-2 space-y-0"><RadioGroupItem value="c"/><Label className="font-normal text-sm">C</Label></div>
                                                    <div className="flex items-center space-x-2 space-y-0"><RadioGroupItem value="nc"/><Label className="font-normal text-sm">NC</Label></div>
                                                    <div className="flex items-center space-x-2 space-y-0"><RadioGroupItem value="na"/><Label className="font-normal text-sm">NA</Label></div>
                                                </RadioGroup>
                                            </FormControl>
                                            {field.value?.status === 'nc' && (
                                                <Textarea placeholder="Observações / Ações corretivas" onChange={(e) => field.onChange({ ...field.value, observacoes: e.target.value })} value={field.value?.observacoes || ''} />
                                            )}
                                        </FormItem>
                                    )}/>
                                ))}
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium">Não Conformidades</h3>
                            <Button type="button" variant="outline" size="sm" onClick={() => appendNc({ descricao: '', riscoAssociado: '', recomendacao: '', prazo: new Date(), responsavelAcao: ''})}><PlusCircle className="mr-2"/> Adicionar</Button>
                        </div>
                         {ncFields.map((field, index) => (
                            <Card key={field.id} className="mb-4 p-4 relative">
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeNc(index)}><Trash2 className="h-4 w-4" /></Button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name={`naoConformidades.${index}.descricao`} render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={form.control} name={`naoConformidades.${index}.riscoAssociado`} render={({ field }) => ( <FormItem><FormLabel>Risco Associado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={form.control} name={`naoConformidades.${index}.recomendacao`} render={({ field }) => ( <FormItem><FormLabel>Recomendação</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={form.control} name={`naoConformidades.${index}.prazo`} render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Prazo</FormLabel><CalendarPopover mode="single" selected={field.value} onSelect={field.onChange}><FormControl><Button variant={'outline'} className={cn('w-full justify-start text-left font-normal',!field.value && 'text-muted-foreground')}>{field.value ? (format(field.value, 'PPP', { locale: ptBR })) : (<span>Escolha o prazo</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></CalendarPopover><FormMessage /></FormItem>)}/>
                                    <FormField control={form.control} name={`naoConformidades.${index}.responsavelAcao`} render={({ field }) => ( <FormItem><FormLabel>Responsável pela Ação</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                </div>
                            </Card>
                        ))}
                        {ncFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma não conformidade adicionada.</p>}
                    </div>
                </CardContent>
            </Card>

          {/* Seção PGR */}
          <Card>
            <CardHeader>
              <CardTitle>Avaliação de Riscos (PGR)</CardTitle>
              <FormField control={form.control} name="pgr.preencher" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-4">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="font-normal">Preencher seção de PGR nesta vistoria</FormLabel>
                </FormItem>
              )}/>
            </CardHeader>
            {pgrValues?.preencher && (
              <CardContent className="space-y-6">
                 {/* FORMULÁRIO DO PGR AQUI */}
              </CardContent>
            )}
          </Card>

          {/* Seção LTCAT */}
          <Card>
            <CardHeader>
              <CardTitle>Caracterização Ambiental (LTCAT)</CardTitle>
              <FormField control={form.control} name="ltcat.preencher" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-4">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="font-normal">Preencher seção de LTCAT nesta vistoria</FormLabel>
                </FormItem>
              )}/>
            </CardHeader>
            {ltcatValues?.preencher && (
              <CardContent className="space-y-6">
                {/* FORMULÁRIO DO LTCAT AQUI */}
              </CardContent>
            )}
          </Card>
          
          <Card>
             <CardHeader>
                <CardTitle>Assinaturas</CardTitle>
                <CardDescription>Colete as assinaturas dos responsáveis.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                <div className="text-center space-y-2">
                    <p className="font-medium">Responsável pela Vistoria</p>
                    <div className="bg-muted h-24 rounded-md flex items-center justify-center">
                        <p className="text-lg font-serif">{service.tecnico || user?.displayName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{service.tecnico || user?.displayName}</p>
                </div>
                <div className="text-center space-y-2">
                    <p className="font-medium">Responsável pela Área/Empresa</p>
                     <div className="bg-muted h-24 rounded-md flex items-center justify-center">
                        {form.watch('assinaturaResponsavelArea') ? (
                             <p className="text-lg font-serif">{form.watch('assinaturaResponsavelArea')?.nome}</p>
                        ) : (
                             <Button type="button" variant="outline" onClick={() => { setSignatureFor('responsavel'); setIsSigning(true); }}><Signature className="mr-2" />Coletar Assinatura</Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">{form.watch('assinaturaResponsavelArea')?.nome || 'Assinatura pendente'}</p>
                </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
             <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
             <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : (fichaToEdit ? 'Salvar Alterações' : 'Salvar Ficha')}
            </Button>
          </div>
        </form>
      </Form>
      
      <AlertDialog open={isSigning} onOpenChange={setIsSigning}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Coletar Assinatura</AlertDialogTitle>
                <AlertDialogDescription>Digite o nome completo do responsável para registrar a assinatura.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
                <Label htmlFor="signature-name">Nome do Responsável</Label>
                <Input id="signature-name" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder="Nome completo" />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSignatureFor(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSign} disabled={!signatureName}>Assinar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
