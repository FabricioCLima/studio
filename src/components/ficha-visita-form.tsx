
'use client';

import type { Service } from '@/app/(main)/engenharia/page';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';

const gseSchema = z.object({
  setor: z.string().min(1, 'Setor é obrigatório'),
  funcao: z.string().min(1, 'Função é obrigatória'),
  totalTrabalhadores: z.coerce.number().min(0, 'Inválido'),
  trabalhadoresExpostos: z.coerce.number().min(0, 'Inválido'),
  jornadaTrabalho: z.string().optional(),
  descricaoAtividades: z.string().optional(),
});

const agenteNocivoSchema = z.object({
  agente: z.string().optional(),
  fonteGeradora: z.string().optional(),
  intensidade: z.string().optional(),
  tecnicaUtilizada: z.string().optional(),
  epiEpc: z.string().optional(),
});

const ltcatSchema = z.object({
    preencher: z.boolean().default(false),
    fisicos: z.array(agenteNocivoSchema).optional(),
    quimicos: z.array(agenteNocivoSchema).optional(),
    biologicos: z.array(agenteNocivoSchema).optional(),
    associacao: z.array(agenteNocivoSchema).optional(),
    conclusao: z.string().optional(),
});

const pgrSchema = z.object({
    preencher: z.boolean().default(false),
    introducao: z.string().optional(),
    identificacaoPerigos: z.string().optional(),
    inventarioRiscos: z.string().optional(),
    planoAcao: z.string().optional(),
});

const formSchema = z.object({
  gse: z.array(gseSchema),
  ltcat: ltcatSchema,
  pgr: pgrSchema,
});

type FichaVisitaFormValues = z.infer<typeof formSchema>;

interface FichaVisitaFormProps {
    service: Service;
    onSave?: () => void;
}

export function FichaVisitaForm({ service, onSave }: FichaVisitaFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FichaVisitaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gse: [{ setor: '', funcao: '', totalTrabalhadores: 0, trabalhadoresExpostos: 0 }],
      ltcat: {
        preencher: false,
        fisicos: [{}],
        quimicos: [{}],
        biologicos: [{}],
        associacao: [{}],
      },
      pgr: {
        preencher: false,
      }
    },
  });
  
  // @ts-ignore
  const { fields: gseFields, append: gseAppend, remove: gseRemove } = useFieldArray({ control: form.control, name: 'gse' });
  // @ts-ignore
  const { fields: ltcatFisicosFields, append: ltcatFisicosAppend, remove: ltcatFisicosRemove } = useFieldArray({ control: form.control, name: 'ltcat.fisicos' });
  // @ts-ignore
  const { fields: ltcatQuimicosFields, append: ltcatQuimicosAppend, remove: ltcatQuimicosRemove } = useFieldArray({ control: form.control, name: 'ltcat.quimicos' });
  // @ts-ignore
  const { fields: ltcatBiologicosFields, append: ltcatBiologicosAppend, remove: ltcatBiologicosRemove } = useFieldArray({ control: form.control, name: 'ltcat.biologicos' });
  // @ts-ignore
  const { fields: ltcatAssociacaoFields, append: ltcatAssociacaoAppend, remove: ltcatAssociacaoRemove } = useFieldArray({ control: form.control, name: 'ltcat.associacao' });
  
  const ltcatValues = form.watch('ltcat');
  const pgrValues = form.watch('pgr');

  async function onSubmit(values: FichaVisitaFormValues) {
    setIsSubmitting(true);
    try {
        const serviceRef = doc(db, 'servicos', service.id);

        const dataToUpdate = {
            'fichaVisita': values
        };

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

  const renderAgenteNocivoFields = (namePrefix, fields, append, remove, title) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">{title}</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => append({})}><PlusCircle className="mr-2 h-4 w-4" />Adicionar</Button>
            </div>
            {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border rounded-md relative">
                    <FormField control={form.control} name={`${namePrefix}.${index}.agente`} render={({ field }) => (<FormItem><FormLabel>Agente</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`${namePrefix}.${index}.fonteGeradora`} render={({ field }) => (<FormItem><FormLabel>Fonte Geradora</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`${namePrefix}.${index}.intensidade`} render={({ field }) => (<FormItem><FormLabel>Intensidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`${namePrefix}.${index}.tecnicaUtilizada`} render={({ field }) => (<FormItem><FormLabel>Técnica</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name={`${namePrefix}.${index}.epiEpc`} render={({ field }) => (<FormItem><FormLabel>EPI/EPC</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
            ))}
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* GSE - Grupos Similares de Exposição */}
        <Card>
            <CardHeader>
                <CardTitle>GSE - Grupos Similares de Exposição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {gseFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             <FormField control={form.control} name={`gse.${index}.setor`} render={({ field }) => (<FormItem><FormLabel>Setor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name={`gse.${index}.funcao`} render={({ field }) => (<FormItem><FormLabel>Função</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name={`gse.${index}.totalTrabalhadores`} render={({ field }) => (<FormItem><FormLabel>Total Trabalhadores</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name={`gse.${index}.trabalhadoresExpostos`} render={({ field }) => (<FormItem><FormLabel>Trabalhadores Expostos</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name={`gse.${index}.jornadaTrabalho`} render={({ field }) => (<FormItem><FormLabel>Jornada</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                        <FormField control={form.control} name={`gse.${index}.descricaoAtividades`} render={({ field }) => (<FormItem><FormLabel>Descrição das Atividades</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                         <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => gseRemove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => gseAppend({ setor: '', funcao: '', totalTrabalhadores: 0, trabalhadoresExpostos: 0  })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar GSE</Button>
            </CardContent>
        </Card>
        
        {/* LTCAT */}
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>LTCAT - Laudo Técnico das Condições Ambientais de Trabalho</CardTitle>
                    <FormField
                        control={form.control}
                        name="ltcat.preencher"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Preencher LTCAT</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>
            </CardHeader>
            {ltcatValues?.preencher && (
              <CardContent className="space-y-6">
                {renderAgenteNocivoFields('ltcat.fisicos', ltcatFisicosFields, ltcatFisicosAppend, ltcatFisicosRemove, 'Agentes Nocivos - Físicos')}
                {renderAgenteNocivoFields('ltcat.quimicos', ltcatQuimicosFields, ltcatQuimicosAppend, ltcatQuimicosRemove, 'Agentes Nocivos - Químicos')}
                {renderAgenteNocivoFields('ltcat.biologicos', ltcatBiologicosFields, ltcatBiologicosAppend, ltcatBiologicosRemove, 'Agentes Nocivos - Biológicos')}
                {renderAgenteNocivoFields('ltcat.associacao', ltcatAssociacaoFields, ltcatAssociacaoAppend, ltcatAssociacaoRemove, 'Associação de Agentes')}
                
                <Separator />

                <FormField control={form.control} name="ltcat.conclusao" render={({ field }) => (<FormItem><FormLabel>Conclusão</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl></FormItem>)} />
              </CardContent>
            )}
        </Card>


        {/* PGR */}
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>PGR - Programa de Gerenciamento de Riscos</CardTitle>
                    <FormField
                        control={form.control}
                        name="pgr.preencher"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Preencher PGR</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>
            </CardHeader>
             {pgrValues?.preencher && (
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="pgr.introducao" render={({ field }) => (<FormItem><FormLabel>Introdução</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="pgr.identificacaoPerigos" render={({ field }) => (<FormItem><FormLabel>Identificação de Perigos</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="pgr.inventarioRiscos" render={({ field }) => (<FormItem><FormLabel>Inventário de Riscos</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="pgr.planoAcao" render={({ field }) => (<FormItem><FormLabel>Plano de Ação</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl></FormItem>)} />
                </CardContent>
            )}
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
            {isSubmitting ? 'Salvando...' : 'Salvar Ficha'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
