
'use client';

import type { Service } from '@/app/(main)/engenharia/page';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Keyboard, PlusCircle, Trash2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { AssignDigitadorDialog } from './assign-digitador-dialog';

// Section 3: PGR
const pgrRiscoSchema = z.object({
  perigo: z.string().optional(),
  fonte: z.string().optional(),
  risco: z.string().optional(),
  funcoesExpostas: z.string().optional(),
  controles: z.string().optional(),
});

// Section 4: LTCAT
const ltcatAgenteSchema = z.object({
  agente: z.string().optional(),
  tipo: z.string().optional(),
  analise: z.string().optional(),
  equipamento: z.string().optional(),
  resultado: z.string().optional(),
  limite: z.string().optional(),
  conclusao: z.string().optional(),
});

// Section 5: Checklist
const checklistItemSchema = z.object({
  categoria: z.string().optional(),
  item: z.string().optional(),
  status: z.enum(['C', 'NC', 'NA']).optional(),
  observacoes: z.string().optional(),
});

// Section 6: Plano de Ação
const planoAcaoItemSchema = z.object({
  descricao: z.string().optional(),
  risco: z.string().optional(),
  recomendacao: z.string().optional(),
  prazo: z.string().optional(),
  responsavel: z.string().optional(),
});

const formSchema = z.object({
  // Section 1
  horaTermino: z.string().optional(),
  tipoVisita: z.string().optional(),
  objetivoPrincipal: z.string().optional(),
  
  // Section 2
  setorInspecionado: z.string().optional(),
  responsavelEmpresa: z.string().optional(),
  cargoResponsavel: z.string().optional(),

  // Section 3: PGR
  descricaoAmbiente: z.string().optional(),
  descricaoProcessos: z.string().optional(),
  populacaoExposta: z.coerce.number().optional(),
  funcoesPresentes: z.string().optional(),
  pgrRiscos: z.array(pgrRiscoSchema).optional(),

  // Section 4: LTCAT
  mudancaLayout: z.enum(['sim', 'nao']).optional(),
  descricaoAtividadeLTCAT: z.string().optional(),
  ltcatAgentes: z.array(ltcatAgenteSchema).optional(),
  eficaciaEPC: z.string().optional(),
  eficaciaEPI: z.string().optional(),
  observacoesEPI: z.string().optional(),

  // Section 5: Checklist
  checklist: z.array(checklistItemSchema).optional(),

  // Section 6: Plano de Ação
  planoAcao: z.array(planoAcaoItemSchema).optional(),

  // Section 7: Conclusão
  parecerTecnico: z.string().optional(),
  pendencias: z.string().optional(),
});

type FichaVisitaFormValues = z.infer<typeof formSchema>;

interface FichaVisitaFormProps {
    service: Service;
    onSave?: () => void;
}

export function FichaVisitaForm({ service, onSave }: FichaVisitaFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const form = useForm<FichaVisitaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      horaTermino: '',
      tipoVisita: '',
      objetivoPrincipal: '',
      setorInspecionado: '',
      responsavelEmpresa: '',
      cargoResponsavel: '',
      descricaoAmbiente: '',
      descricaoProcessos: '',
      populacaoExposta: 0,
      funcoesPresentes: '',
      mudancaLayout: 'nao',
      descricaoAtividadeLTCAT: '',
      eficaciaEPC: '',
      eficaciaEPI: '',
      observacoesEPI: '',
      parecerTecnico: '',
      pendencias: '',
      pgrRiscos: [{ perigo: '', fonte: '', risco: '', funcoesExpostas: '', controles: '' }],
      ltcatAgentes: [{ agente: '', tipo: '', analise: '', equipamento: '', resultado: '', limite: '', conclusao: '' }],
      checklist: [
        { categoria: 'NR-12 (Máquinas)', item: 'Proteções de partes móveis estão instaladas e funcionais?', status: 'NA', observacoes: '' },
        { categoria: 'NR-12 (Máquinas)', item: 'Dispositivos de parada de emergência estão acessíveis?', status: 'NA', observacoes: '' },
        { categoria: 'NR-10 (Elétrica)', item: 'Quadros elétricos estão sinalizados e trancados?', status: 'NA', observacoes: '' },
        { categoria: 'NR-23 (Incêndio)', item: 'Extintores com validade em dia e desobstruídos?', status: 'NA', observacoes: '' },
        { categoria: 'NR-35 (Altura)', item: 'Análise de Risco e Permissão de Trabalho emitidas?', status: 'NA', observacoes: '' },
      ],
      planoAcao: [{ descricao: '', risco: '', recomendacao: '', prazo: '', responsavel: '' }],
    },
  });

  useEffect(() => {
    // @ts-ignore
    if (service && service.fichaVisita) {
      // @ts-ignore
      form.reset(service.fichaVisita);
    }
  }, [service, form]);

  const { fields: pgrRiscosFields, append: pgrRiscosAppend, remove: pgrRiscosRemove } = useFieldArray({ control: form.control, name: 'pgrRiscos' });
  const { fields: ltcatAgentesFields, append: ltcatAgentesAppend, remove: ltcatAgentesRemove } = useFieldArray({ control: form.control, name: 'ltcatAgentes' });
  const { fields: checklistFields, append: checklistAppend } = useFieldArray({ control: form.control, name: 'checklist' });
  const { fields: planoAcaoFields, append: planoAcaoAppend, remove: planoAcaoRemove } = useFieldArray({ control: form.control, name: 'planoAcao' });


  async function onSubmit(values: FichaVisitaFormValues) {
    setIsSubmitting(true);
    try {
        const serviceRef = doc(db, 'servicos', service.id);
        const dataToUpdate = { fichaVisita: values };
        await updateDoc(serviceRef, dataToUpdate);
        toast({
            title: 'Sucesso!',
            description: 'Ficha de visita salva com sucesso.',
            className: 'bg-accent text-accent-foreground',
        });
        onSave?.();
    } catch (error) {
        console.error('Error saving Ficha de Visita: ', error);
        toast({
            variant: 'destructive',
            title: 'Erro!',
            description: 'Não foi possível salvar a ficha de visita.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const renderStatusSelect = (field: any) => (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value="C">Conforme</SelectItem>
        <SelectItem value="NC">Não Conforme</SelectItem>
        <SelectItem value="NA">Não se Aplica</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
          {/* Section 1 & 2 */}
          <AccordionItem value="item-1">
            <AccordionTrigger>Seção 1 e 2: Identificação da Visita e Dados do Cliente</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <Card>
                <CardHeader><CardTitle>Identificação da Visita</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="horaTermino" render={({ field }) => (<FormItem><FormLabel>Hora de Término</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="tipoVisita" render={({ field }) => (<FormItem><FormLabel>Tipo de Visita</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="elaboracao">Elaboração/Renovação de Documentos</SelectItem>
                        <SelectItem value="auditoria">Auditoria de Rotina</SelectItem>
                        <SelectItem value="investigacao">Investigação de Acidente</SelectItem>
                        <SelectItem value="analise">Análise de Posto de Trabalho</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>)} />
                  <FormField control={form.control} name="objetivoPrincipal" render={({ field }) => (<FormItem className="md:col-span-3"><FormLabel>Objetivo Principal</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Dados do Cliente</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="setorInspecionado" render={({ field }) => (<FormItem><FormLabel>Setor/Área Inspecionada</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="responsavelEmpresa" render={({ field }) => (<FormItem><FormLabel>Responsável da Empresa (Acompanhante)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="cargoResponsavel" render={({ field }) => (<FormItem><FormLabel>Cargo do Responsável</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Section 3 */}
          <AccordionItem value="item-3">
            <AccordionTrigger>Seção 3: Análise para o PGR (NR-1)</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <FormField control={form.control} name="descricaoAmbiente" render={({ field }) => (<FormItem><FormLabel>Descrição do Ambiente de Trabalho</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="descricaoProcessos" render={({ field }) => (<FormItem><FormLabel>Descrição dos Processos e Atividades</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl></FormItem>)} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="populacaoExposta" render={({ field }) => (<FormItem><FormLabel>População Exposta (Nº)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="funcoesPresentes" render={({ field }) => (<FormItem><FormLabel>Funções Presentes no Setor</FormLabel><FormControl><Input placeholder="Ex: Operador, Soldador" {...field} /></FormControl></FormItem>)} />
              </div>
              <Separator />
              <h3 className="text-lg font-semibold">Identificação de Perigos e Avaliação de Riscos</h3>
              {pgrRiscosFields.map((field, index) => (
                <Card key={field.id} className="relative p-4">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => pgrRiscosRemove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name={`pgrRiscos.${index}.perigo`} render={({ field }) => (<FormItem><FormLabel>Perigo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`pgrRiscos.${index}.fonte`} render={({ field }) => (<FormItem><FormLabel>Fonte/Circunstância</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`pgrRiscos.${index}.risco`} render={({ field }) => (<FormItem><FormLabel>Risco</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="fisico">Físico</SelectItem><SelectItem value="quimico">Químico</SelectItem><SelectItem value="biologico">Biológico</SelectItem><SelectItem value="ergonomico">Ergonômico</SelectItem><SelectItem value="acidente">Acidente</SelectItem></SelectContent>
                      </Select>
                    </FormItem>)} />
                    <FormField control={form.control} name={`pgrRiscos.${index}.funcoesExpostas`} render={({ field }) => (<FormItem><FormLabel>Funções Expostas</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`pgrRiscos.${index}.controles`} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Medidas de Controle Existentes</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                  </div>
                </Card>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => pgrRiscosAppend({ perigo: '', fonte: '', risco: '', funcoesExpostas: '', controles: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Risco</Button>
            </AccordionContent>
          </AccordionItem>

          {/* Section 4 */}
          <AccordionItem value="item-4">
            <AccordionTrigger>Seção 4: Análise para o LTCAT (IN nº 128/2022)</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                 <FormField control={form.control} name="mudancaLayout" render={({ field }) => (<FormItem><FormLabel>Houve Mudança de Layout ou Processo?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent>
                    </Select>
                 </FormItem>)} />
                <FormField control={form.control} name="descricaoAtividadeLTCAT" render={({ field }) => (<FormItem><FormLabel>Descrição da Atividade para Análise Previdenciária</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl></FormItem>)} />
                <Separator />
                <h3 className="text-lg font-semibold">Avaliação de Agentes Nocivos</h3>
                 {ltcatAgentesFields.map((field, index) => (
                    <Card key={field.id} className="relative p-4">
                         <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => ltcatAgentesRemove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <FormField control={form.control} name={`ltcatAgentes.${index}.agente`} render={({ field }) => (<FormItem><FormLabel>Agente Nocivo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name={`ltcatAgentes.${index}.tipo`} render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="fisico">Físico</SelectItem><SelectItem value="quimico">Químico</SelectItem><SelectItem value="biologico">Biológico</SelectItem></SelectContent></Select></FormItem>)} />
                            <FormField control={form.control} name={`ltcatAgentes.${index}.analise`} render={({ field }) => (<FormItem><FormLabel>Análise</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="qualitativa">Qualitativa</SelectItem><SelectItem value="quantitativa">Quantitativa</SelectItem></SelectContent></Select></FormItem>)} />
                            <FormField control={form.control} name={`ltcatAgentes.${index}.equipamento`} render={({ field }) => (<FormItem><FormLabel>Equipamento</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name={`ltcatAgentes.${index}.resultado`} render={({ field }) => (<FormItem><FormLabel>Resultado</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name={`ltcatAgentes.${index}.limite`} render={({ field }) => (<FormItem><FormLabel>Limite</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name={`ltcatAgentes.${index}.conclusao`} render={({ field }) => (<FormItem><FormLabel>Acima do Limite?</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent></Select></FormItem>)} />
                         </div>
                    </Card>
                 ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => ltcatAgentesAppend({ agente: '', tipo: '', analise: '', equipamento: '', resultado: '', limite: '', conclusao: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Agente</Button>
                 <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="eficaciaEPC" render={({ field }) => (<FormItem><FormLabel>Eficácia do EPC</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="eficaz">Eficaz</SelectItem><SelectItem value="parcial">Parcialmente Eficaz</SelectItem><SelectItem value="ineficaz">Ineficaz</SelectItem><SelectItem value="inexistente">Inexistente</SelectItem></SelectContent></Select></FormItem>)} />
                    <FormField control={form.control} name="eficaciaEPI" render={({ field }) => (<FormItem><FormLabel>Eficácia do EPI</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="eficaz">Eficaz</SelectItem><SelectItem value="parcial">Parcialmente Eficaz</SelectItem><SelectItem value="ineficaz">Ineficaz</SelectItem><SelectItem value="inexistente">Inexistente</SelectItem></SelectContent></Select></FormItem>)} />
                    <FormField control={form.control} name="observacoesEPI" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Observações sobre EPI</FormLabel><FormControl><Textarea placeholder="Possui C.A.? É utilizado corretamente? Higienização, etc." {...field} /></FormControl></FormItem>)} />
                </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 5 */}
          <AccordionItem value="item-5">
            <AccordionTrigger>Seção 5: Checklist Geral de Conformidade</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-[2fr_3fr_1fr_2fr] items-center p-2 font-medium bg-muted">
                    <p>Categoria</p><p>Item de Verificação</p><p>Status</p><p>Observações</p>
                </div>
                 {checklistFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[2fr_3fr_1fr_2fr] items-start gap-x-4 p-2 border-t">
                        <FormField control={form.control} name={`checklist.${index}.categoria`} render={({ field }) => (<FormItem><FormControl><Input {...field} className="font-semibold" /></FormControl></FormItem>)} />
                        <FormField control={form.control} name={`checklist.${index}.item`} render={({ field }) => (<FormItem><FormControl><Textarea {...field} className="text-sm" /></FormControl></FormItem>)} />
                        <FormField control={form.control} name={`checklist.${index}.status`} render={({ field }) => (<FormItem>{renderStatusSelect(field)}</FormItem>)} />
                        <FormField control={form.control} name={`checklist.${index}.observacoes`} render={({ field }) => (<FormItem><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                    </div>
                 ))}
              </div>
               <Button type="button" variant="outline" size="sm" onClick={() => checklistAppend({ categoria: '', item: '', status: 'NA', observacoes: ''})}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Item ao Checklist</Button>
            </AccordionContent>
          </AccordionItem>

           {/* Section 6 */}
          <AccordionItem value="item-6">
            <AccordionTrigger>Seção 6: Plano de Ação (Não Conformidades)</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                 {planoAcaoFields.map((field, index) => (
                    <Card key={field.id} className="relative p-4">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => planoAcaoRemove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField control={form.control} name={`planoAcao.${index}.descricao`} render={({ field }) => (<FormItem><FormLabel>Descrição da Não Conformidade</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                             <FormField control={form.control} name={`planoAcao.${index}.risco`} render={({ field }) => (<FormItem><FormLabel>Risco Associado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="baixo">Baixo</SelectItem><SelectItem value="medio">Médio</SelectItem><SelectItem value="alto">Alto</SelectItem></SelectContent></Select></FormItem>)} />
                            <FormField control={form.control} name={`planoAcao.${index}.recomendacao`} render={({ field }) => (<FormItem><FormLabel>Recomendação / Ação Corretiva</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name={`planoAcao.${index}.prazo`} render={({ field }) => (<FormItem><FormLabel>Prazo</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name={`planoAcao.${index}.responsavel`} render={({ field }) => (<FormItem><FormLabel>Responsável (Cliente)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                         </div>
                    </Card>
                 ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => planoAcaoAppend({ descricao: '', risco: '', recomendacao: '', prazo: '', responsavel: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar Não Conformidade</Button>
            </AccordionContent>
          </AccordionItem>

           {/* Section 7 */}
          <AccordionItem value="item-7">
            <AccordionTrigger>Seção 7: Conclusão e Assinaturas</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                 <FormField control={form.control} name="parecerTecnico" render={({ field }) => (<FormItem><FormLabel>Parecer Técnico Geral</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl></FormItem>)} />
                 <FormField control={form.control} name="pendencias" render={({ field }) => (<FormItem><FormLabel>Pendências (Documentos a receber, etc.)</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-2">
                        <Label>Assinatura do Técnico</Label>
                        <div className="h-24 rounded-md border-dashed border-2 flex items-center justify-center text-muted-foreground">
                            Campo para assinatura digital
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Assinatura do Responsável da Empresa</Label>
                        <div className="h-24 rounded-md border-dashed border-2 flex items-center justify-center text-muted-foreground">
                             Campo para assinatura digital
                        </div>
                    </div>
                 </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>

        <div className="flex justify-end gap-2">
           <Button type="button" variant="outline" onClick={() => setIsAssigning(true)} disabled={isSubmitting}>
             <Keyboard className="mr-2 h-4 w-4" />
             Atribuir para Digitação
           </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
            {isSubmitting ? 'Salvando...' : 'Salvar Ficha'}
          </Button>
        </div>
      </form>
    </Form>
    {isAssigning && (
        <AssignDigitadorDialog
            open={isAssigning}
            onOpenChange={setIsAssigning}
            service={service}
            onSuccess={() => {
                setIsAssigning(false);
                toast({
                    title: 'Sucesso!',
                    description: 'Serviço enviado para a Digitação com sucesso.',
                    className: 'bg-accent text-accent-foreground',
                });
                onSave?.();
            }}
        />
    )}
    </>
  );
}
