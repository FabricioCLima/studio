
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AgenteBiologico, AgenteFisico, AgenteQuimico, Assinatura, FichaVisita, PgrAcaoCorretiva, Service, NaoConformidadeDetalhada, ChecklistItem } from '@/app/(main)/engenharia/page';
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

// Schemas para a nova Ficha Detalhada
const checklistItemSchema = z.object({
    status: z.enum(['c', 'nc', 'na'], { required_error: 'Selecione uma opção.' }),
    observacoes: z.string().optional(),
    evidencia: z.string().optional(),
});

const naoConformidadeDetalhadaSchema = z.object({
  id: z.string(),
  descricao: z.string().min(1, 'Descrição é obrigatória.'),
  riscoAssociado: z.enum(['baixo', 'medio', 'alto'], { required_error: 'Nível de risco é obrigatório.' }),
  normaRegulamentadora: z.string().min(1, 'NR é obrigatória.'),
  recomendacao: z.string().min(1, 'Recomendação é obrigatória.'),
  prazo: z.date({ required_error: 'Prazo é obrigatório.' }),
  responsavel: z.string().min(1, 'Responsável é obrigatório.'),
});

const assinaturaSchema = z.object({
    nome: z.string(),
    data: z.date(),
}).nullable().optional();

// Schemas PGR (mantidos para sub-seção)
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
    checklistPGR: z.record(z.object({ status: z.enum(['c', 'nc', 'na']) })).optional(),
    planoAcao: z.array(planoAcaoSchema).optional(),
    assinaturaResponsavelArea: assinaturaSchema,
}).optional();

// Schemas LTCAT (mantidos para sub-seção)
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
    epis: z.array(z.string()).optional(),
    episOutros: z.string().optional(),
    episEficaz: z.enum(['sim', 'nao', 'na']).optional(),
    observacoes: z.string().optional(),
    fotos: z.array(z.string()).optional(),
    assinaturaResponsavelArea: assinaturaSchema,
}).optional();

// Schema principal do formulário
const formSchema = z.object({
  id: z.string(),
  dataVisita: z.date({ required_error: 'Data é obrigatória.' }),
  horaInicio: z.string().min(1, 'Horário de início é obrigatório.'),
  horaTermino: z.string().optional(),
  tecnicoResponsavel: z.string(),
  tipoVisita: z.enum(['rotina', 'investigacao', 'auditoria', 'fiscalizacao', 'outro'], { required_error: 'Selecione o tipo de visita.' }),
  objetivoVisita: z.string().optional(),
  
  setorInspecionado: z.string().min(1, 'Setor é obrigatório.'),
  responsavelEmpresa: z.string().min(1, 'Acompanhante é obrigatório.'),
  cargoResponsavel: z.string().optional(),
  contatoResponsavel: z.string().optional(),

  checklist: z.record(checklistItemSchema),
  naoConformidades: z.array(naoConformidadeDetalhadaSchema).optional(),

  pontosPositivos: z.string().optional(),
  outrasObservacoes: z.string().optional(),
  parecerTecnico: z.string().optional(),

  assinaturaTecnico: assinaturaSchema,
  assinaturaResponsavel: assinaturaSchema,

  pgr: pgrSchema,
  ltcat: ltcatSchema,
});

// Listas de Itens
const checklistItems = {
    'Documentação (NR-1)': [ 'PPRA/PGR e PCMSO estão atualizados e implementados?', 'ASO (Atestado de Saúde Ocupacional) dos trabalhadores em dia?', 'CIPA constituída e atuante (atas de reunião, mapa de riscos)?'],
    'EPIs (NR-6)': ['Fornecimento de EPIs adequado à função e com C.A. válido?', 'Fichas de entrega de EPIs devidamente preenchidas e assinadas?', 'Trabalhadores utilizando os EPIs corretamente?'],
    'Máquinas (NR-12)': ['Proteções fixas e móveis em bom estado e funcionais?', 'Dispositivos de parada de emergência acessíveis e operantes?', 'Manutenção preventiva das máquinas em dia?'],
    'Instalações Elétricas (NR-10)': ['Quadros elétricos sinalizados, trancados e sem materiais próximos?', 'Fiações e cabos protegidos contra danos mecânicos?'],
    'Combate a Incêndio (NR-23)': ['Extintores inspecionados, com carga válida e bem localizados?', 'Saídas de emergência e rotas de fuga desobstruídas e sinalizadas?'],
    'Sinalização (NR-26)': ['Sinalização de segurança (riscos, EPIs, rotas) visível e adequada?'],
    'Trabalho em Altura (NR-35)': ['Equipamentos (andaimes, escadas, cintos) em bom estado?', 'Análise de Risco (AR) e Permissão de Trabalho (PT) emitidas?'],
    'Ambiente Geral': ['Organização, limpeza e arrumação (5S) do local?', 'Iluminação e ventilação adequadas para a atividade?'],
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

const generateInitialChecklist = () => Object.values(checklistItems).flat().reduce((acc, item) => ({ ...acc, [item]: { status: 'na', observacoes: '', evidencia: '' } }), {});
const generateInitialChecklistPGR = () => Object.values(checklistItemsPGR).flat().reduce((acc, item) => ({ ...acc, [item]: { status: 'na' } }), {});

const generateDefaultValues = (service: Service | null, user: any) => ({
    id: `VISITA-${Date.now()}`,
    dataVisita: new Date(),
    horaInicio: new Date().toTimeString().slice(0, 5),
    horaTermino: '',
    tecnicoResponsavel: service?.tecnico || user?.displayName || 'Não identificado',
    tipoVisita: 'rotina' as const,
    objetivoVisita: '',
    setorInspecionado: '',
    responsavelEmpresa: '',
    cargoResponsavel: '',
    contatoResponsavel: '',
    checklist: generateInitialChecklist(),
    naoConformidades: [],
    pontosPositivos: '',
    outrasObservacoes: '',
    parecerTecnico: '',
    assinaturaTecnico: null,
    assinaturaResponsavel: null,
    pgr: {
        preencher: false,
        numeroVistoria: '',
        atividade: '',
        responsavelVistoria: service?.tecnico || '',
        acompanhantes: '',
        checklistPGR: generateInitialChecklistPGR(),
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
  const [signatureFor, setSignatureFor] = useState<'tecnico' | 'responsavel' | 'pgr' | 'ltcat' | null>(null);
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
      const defaultData = generateDefaultValues(service, user);
      
      const pgrData = fichaToEdit.pgr ? {
          ...defaultData.pgr,
          ...fichaToEdit.pgr,
          preencher: true,
          planoAcao: (fichaToEdit.pgr.planoAcao || []).map(pa => ({ ...pa, prazo: new Date((pa.prazo as any).seconds * 1000) })),
          assinaturaResponsavelArea: fichaToEdit.pgr.assinaturaResponsavelArea ? { ...fichaToEdit.pgr.assinaturaResponsavelArea, data: new Date((fichaToEdit.pgr.assinaturaResponsavelArea.data as any).seconds * 1000) } : null,
      } : defaultData.pgr;

      const ltcatData = fichaToEdit.ltcat ? {
        ...defaultData.ltcat,
        ...fichaToEdit.ltcat,
        preencher: true,
        assinaturaResponsavelArea: fichaToEdit.ltcat.assinaturaResponsavelArea ? { ...fichaToEdit.ltcat.assinaturaResponsavelArea, data: new Date((fichaToEdit.ltcat.assinaturaResponsavelArea.data as any).seconds * 1000) } : null,
      } : defaultData.ltcat;

      form.reset({
        ...defaultData,
        ...fichaToEdit,
        horaTermino: fichaToEdit.horaTermino || '',
        objetivoVisita: fichaToEdit.objetivoVisita || '',
        cargoResponsavel: fichaToEdit.cargoResponsavel || '',
        contatoResponsavel: fichaToEdit.contatoResponsavel || '',
        pontosPositivos: fichaToEdit.pontosPositivos || '',
        outrasObservacoes: fichaToEdit.outrasObservacoes || '',
        parecerTecnico: fichaToEdit.parecerTecnico || '',
        dataVisita: new Date(fichaToEdit.dataVisita.seconds * 1000),
        naoConformidades: (fichaToEdit.naoConformidades || []).map(nc => ({...nc, prazo: new Date((nc.prazo as any).seconds * 1000)})),
        assinaturaTecnico: fichaToEdit.assinaturaTecnico ? { ...fichaToEdit.assinaturaTecnico, data: new Date((fichaToEdit.assinaturaTecnico.data as any).seconds * 1000) } : null,
        assinaturaResponsavel: fichaToEdit.assinaturaResponsavel ? { ...fichaToEdit.assinaturaResponsavel, data: new Date((fichaToEdit.assinaturaResponsavel.data as any).seconds * 1000) } : null,
        pgr: pgrData,
        ltcat: ltcatData,
      });
    } else {
      form.reset(generateDefaultValues(service, user));
    }
  }, [fichaToEdit, form, service, user]);


  const handleSign = () => {
    if (signatureName && signatureFor) {
        const signature = { nome: signatureName, data: new Date() };
        if (signatureFor === 'tecnico') form.setValue('assinaturaTecnico', signature);
        if (signatureFor === 'responsavel') form.setValue('assinaturaResponsavel', signature);
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
            tecnicoResponsavel: service.tecnico || user?.displayName || 'Não identificado',
            localData: `Realizado em ${service.cidade}, ${format(new Date(), 'dd/MM/yyyy')}`
        };
        
        if (dataToSave.pgr) delete (dataToSave.pgr as any).preencher;
        if (dataToSave.ltcat) delete (dataToSave.ltcat as any).preencher;


        let currentServiceDoc = await getDoc(serviceRef);
        if (!currentServiceDoc.exists()) {
             throw new Error("Serviço não encontrado");
        }
        let currentFichas = currentServiceDoc.data().fichasVisita || [];

        if (typeof fichaIndex === 'number' && fichaIndex >= 0) {
            currentFichas[fichaIndex] = dataToSave;
        } else {
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
            
            <Card>
                <CardHeader>
                    <CardTitle>Seção 1: Identificação da Visita</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField control={form.control} name="dataVisita" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Data da Visita</FormLabel><CalendarPopover mode="single" selected={field.value} onSelect={field.onChange}><FormControl><Button variant={'outline'} className={cn('w-full justify-start text-left font-normal',!field.value && 'text-muted-foreground')}>{field.value ? (format(field.value, 'PPP', { locale: ptBR })) : (<span>Escolha a data</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></CalendarPopover><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="horaInicio" render={({ field }) => ( <FormItem><FormLabel>Hora de Início</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="horaTermino" render={({ field }) => ( <FormItem><FormLabel>Hora de Término</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="tipoVisita" render={({ field }) => (
                          <FormItem><FormLabel>Tipo de Visita</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="rotina">Rotina</SelectItem>
                                <SelectItem value="investigacao">Investigação de Acidente/Incidente</SelectItem>
                                <SelectItem value="auditoria">Auditoria</SelectItem>
                                <SelectItem value="fiscalizacao">Atendimento à Fiscalização</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                              </SelectContent>
                            </Select><FormMessage />
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name="objetivoVisita" render={({ field }) => ( <FormItem className="lg:col-span-2"><FormLabel>Objetivo da Visita</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Seção 2: Dados da Empresa Inspecionada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormItem><FormLabel>Razão Social</FormLabel><Input value={service.nomeEmpresa} disabled /></FormItem>
                      <FormItem><FormLabel>CNPJ</FormLabel><Input value={service.cnpj} disabled /></FormItem>
                      <FormField control={form.control} name="setorInspecionado" render={({ field }) => ( <FormItem><FormLabel>Setor/Área Inspecionada</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="responsavelEmpresa" render={({ field }) => ( <FormItem><FormLabel>Responsável da Empresa (Acompanhante)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="cargoResponsavel" render={({ field }) => ( <FormItem><FormLabel>Cargo do Responsável</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="contatoResponsavel" render={({ field }) => ( <FormItem><FormLabel>Contato (Telefone/E-mail)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>Seção 3: Checklist de Conformidade</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-6">
                    {Object.entries(checklistItems).map(([category, items]) => (
                        <div key={category}>
                            <h4 className="font-semibold mb-3 text-base">{category}</h4>
                            <div className="space-y-4">
                            {items.map((item) => (
                                <FormField key={item} control={form.control} name={`checklist.${item}`} render={({ field }) => (
                                    <FormItem className="space-y-2 p-4 border rounded-md shadow-sm">
                                        <FormLabel className="text-sm font-normal">{item}</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={(value) => field.onChange({ ...field.value, status: value })} value={field.value?.status || 'na'} className="flex flex-wrap gap-x-6 gap-y-2">
                                                <div className="flex items-center space-x-2 space-y-0"><RadioGroupItem value="c"/><Label className="font-normal text-sm">C</Label></div>
                                                <div className="flex items-center space-x-2 space-y-0"><RadioGroupItem value="nc"/><Label className="font-normal text-sm">NC</Label></div>
                                                <div className="flex items-center space-x-2 space-y-0"><RadioGroupItem value="na"/><Label className="font-normal text-sm">NA</Label></div>
                                            </RadioGroup>
                                        </FormControl>
                                        {field.value?.status === 'nc' && (
                                            <div className="space-y-2 pt-2">
                                              <Label>Observações / Ação Imediata</Label>
                                              <Textarea placeholder="Descreva a não conformidade e ações tomadas..." onChange={(e) => field.onChange({ ...field.value, observacoes: e.target.value })} value={field.value?.observacoes || ''} />
                                              <Label>Anexar Evidência (URL da Imagem)</Label>
                                              <Input placeholder="https://exemplo.com/foto.jpg" onChange={(e) => field.onChange({ ...field.value, evidencia: e.target.value })} value={field.value?.evidencia || ''}/>
                                            </div>
                                        )}
                                    </FormItem>
                                )}/>
                            ))}
                            </div>
                        </div>
                    ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                  <CardTitle>Seção 4: Registro de Não Conformidades</CardTitle>
                   <CardDescription>Adicione aqui um registro detalhado para cada item marcado como "Não Conforme" (NC) no checklist acima.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex justify-end mb-4">
                        <Button type="button" variant="outline" size="sm" onClick={() => appendNc({ id: `NC-${Date.now()}`, descricao: '', riscoAssociado: 'baixo', normaRegulamentadora: '', recomendacao: '', prazo: new Date(), responsavel: ''})}><PlusCircle className="mr-2"/> Adicionar NC</Button>
                    </div>
                     {ncFields.map((field, index) => (
                        <Card key={field.id} className="mb-4 p-4 relative">
                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeNc(index)}><Trash2 className="h-4 w-4" /></Button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name={`naoConformidades.${index}.descricao`} render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Descrição da Não Conformidade</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name={`naoConformidades.${index}.riscoAssociado`} render={({ field }) => (
                                  <FormItem><FormLabel>Risco Associado</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione o risco" /></SelectTrigger></FormControl>
                                      <SelectContent><SelectItem value="baixo">Baixo</SelectItem><SelectItem value="medio">Médio</SelectItem><SelectItem value="alto">Alto</SelectItem></SelectContent>
                                    </Select><FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={`naoConformidades.${index}.normaRegulamentadora`} render={({ field }) => ( <FormItem><FormLabel>Norma Regulamentadora (NR)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name={`naoConformidades.${index}.recomendacao`} render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Recomendação / Ação Corretiva</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name={`naoConformidades.${index}.prazo`} render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Prazo Sugerido</FormLabel><CalendarPopover mode="single" selected={field.value} onSelect={field.onChange}><FormControl><Button variant={'outline'} className={cn('w-full justify-start text-left font-normal',!field.value && 'text-muted-foreground')}>{field.value ? (format(field.value, 'PPP', { locale: ptBR })) : (<span>Escolha o prazo</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></CalendarPopover><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name={`naoConformidades.${index}.responsavel`} render={({ field }) => ( <FormItem><FormLabel>Responsável (Empresa)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            </div>
                        </Card>
                    ))}
                    {ncFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma não conformidade adicionada.</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Seção 5: Observações Gerais e Conclusão</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="pontosPositivos" render={({ field }) => ( <FormItem><FormLabel>Pontos Positivos Observados</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="outrasObservacoes" render={({ field }) => ( <FormItem><FormLabel>Outras Observações e Comentários</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="parecerTecnico" render={({ field }) => ( <FormItem><FormLabel>Parecer Geral do Técnico</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )}/>
                </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seção Opcional: Avaliação de Riscos (PGR)</CardTitle>
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
                 <p className="text-sm text-muted-foreground">Formulário PGR será exibido aqui...</p>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seção Opcional: Caracterização Ambiental (LTCAT)</CardTitle>
              <FormField control={form.control} name="ltcat.preencher" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-4">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="font-normal">Preencher seção de LTCAT nesta vistoria</FormLabel>
                </FormItem>
              )}/>
            </CardHeader>
            {ltcatValues?.preencher && (
               <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Agentes Nocivos - Físicos</h3>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendAf({ agente: '', fonteGeradora: '', instrumento: '', numeroSerie: '', resultado: '', limiteTolerancia: '', metodologia: '', conclusao: '' })}><PlusCircle className="mr-2"/> Adicionar</Button>
                  </div>
                  {afFields.map((field, index) => (
                      <Card key={field.id} className="p-4 relative">
                          <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeAf(index)}><Trash2 className="h-4 w-4" /></Button>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <FormField control={form.control} name={`ltcat.agentesFisicos.${index}.agente`} render={({ field }) => ( <FormItem><FormLabel>Agente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesFisicos.${index}.fonteGeradora`} render={({ field }) => ( <FormItem><FormLabel>Fonte Geradora</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesFisicos.${index}.instrumento`} render={({ field }) => ( <FormItem><FormLabel>Instrumento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesFisicos.${index}.numeroSerie`} render={({ field }) => ( <FormItem><FormLabel>Nº de Série</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesFisicos.${index}.resultado`} render={({ field }) => ( <FormItem><FormLabel>Resultado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesFisicos.${index}.limiteTolerancia`} render={({ field }) => ( <FormItem><FormLabel>Limite Tolerância</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesFisicos.${index}.metodologia`} render={({ field }) => ( <FormItem><FormLabel>Metodologia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormMessage> </FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesFisicos.${index}.conclusao`} render={({ field }) => ( <FormItem><FormLabel>Conclusão</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                          </div>
                      </Card>
                  ))}
              </div>
              <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Agentes Nocivos - Químicos</h3>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendAq({ agente: '', fonteGeradora: '', tipoAmostra: '', tempoColeta: '', resultado: '', limiteTolerancia: '', metodologia: '', conclusao: ''})}><PlusCircle className="mr-2"/> Adicionar</Button>
                  </div>
                  {aqFields.map((field, index) => (
                      <Card key={field.id} className="p-4 relative">
                          <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeAq(index)}><Trash2 className="h-4 w-4" /></Button>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <FormField control={form.control} name={`ltcat.agentesQuimicos.${index}.agente`} render={({ field }) => ( <FormItem><FormLabel>Agente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesQuimicos.${index}.fonteGeradora`} render={({ field }) => ( <FormItem><FormLabel>Fonte Geradora</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesQuimicos.${index}.tipoAmostra`} render={({ field }) => ( <FormItem><FormLabel>Tipo Amostra</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesQuimicos.${index}.tempoColeta`} render={({ field }) => ( <FormItem><FormLabel>Tempo Coleta</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesQuimicos.${index}.resultado`} render={({ field }) => ( <FormItem><FormLabel>Resultado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesQuimicos.${index}.limiteTolerancia`} render={({ field }) => ( <FormItem><FormLabel>Limite Tolerância</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesQuimicos.${index}.metodologia`} render={({ field }) => ( <FormItem><FormLabel>Metodologia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesQuimicos.${index}.conclusao`} render={({ field }) => ( <FormItem><FormLabel>Conclusão</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                          </div>
                      </Card>
                  ))}
              </div>
              <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Agentes Nocivos - Biológicos</h3>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendAb({ descricao: '', agenteProvavel: '', enquadramento: false })}><PlusCircle className="mr-2"/> Adicionar</Button>
                  </div>
                  {abFields.map((field, index) => (
                      <Card key={field.id} className="p-4 relative">
                          <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeAb(index)}><Trash2 className="h-4 w-4" /></Button>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField control={form.control} name={`ltcat.agentesBiologicos.${index}.descricao`} render={({ field }) => ( <FormItem><FormLabel>Descrição Atividade</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesBiologicos.${index}.agenteProvavel`} render={({ field }) => ( <FormItem><FormLabel>Agente Provável</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                              <FormField control={form.control} name={`ltcat.agentesBiologicos.${index}.enquadramento`} render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 col-span-full"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Enquadramento Legal (Anexo 14, NR-15)</FormLabel></div></FormItem> )}/>
                          </div>
                      </Card>
                  ))}
              </div>
            </CardContent>
            )}
          </Card>
          
          <Card>
             <CardHeader>
                <CardTitle>Seção 6: Finalização e Assinaturas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                <div className="text-center space-y-2">
                    <p className="font-medium">Técnico Responsável</p>
                     <div className="bg-muted h-24 rounded-md flex items-center justify-center">
                        {form.watch('assinaturaTecnico') ? (
                             <p className="text-lg font-serif">{form.watch('assinaturaTecnico')?.nome}</p>
                        ) : (
                             <Button type="button" variant="outline" onClick={() => { setSignatureFor('tecnico'); setIsSigning(true); }}><Signature className="mr-2" />Coletar Assinatura</Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">{form.watch('assinaturaTecnico')?.nome || form.watch('tecnicoResponsavel')}</p>
                </div>
                <div className="text-center space-y-2">
                    <p className="font-medium">Responsável pela Empresa</p>
                     <div className="bg-muted h-24 rounded-md flex items-center justify-center">
                        {form.watch('assinaturaResponsavel') ? (
                             <p className="text-lg font-serif">{form.watch('assinaturaResponsavel')?.nome}</p>
                        ) : (
                             <Button type="button" variant="outline" onClick={() => { setSignatureFor('responsavel'); setIsSigning(true); }}><Signature className="mr-2" />Coletar Assinatura</Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">{form.watch('assinaturaResponsavel')?.nome || 'Assinatura pendente'}</p>
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
