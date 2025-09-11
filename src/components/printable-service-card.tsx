
'use client';

import type { Service } from '@/app/(main)/engenharia/page';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

interface PrintableServiceCardProps {
  service: Service;
}

// @ts-ignore
const FichaData = service.fichaVisita || {};


const statusChecklist: { 
    [key: string]: { 
        label: string; 
    } 
} = {
    C: { label: "Conforme" },
    NC: { label: "Não Conforme" },
    NA: { label: "Não se Aplica" },
};


export const PrintableServiceCard = React.forwardRef<HTMLDivElement, PrintableServiceCardProps>(
  ({ service }, ref) => {
    // @ts-ignore
    const ficha = service.fichaVisita || {};

    return (
      <div ref={ref} className="p-4 sm:p-6 font-sans text-gray-800 bg-white">
        <style type="text/css" media="print">
          {`
            @page { size: auto;  margin: 20mm; }
            @media print {
              body { -webkit-print-color-adjust: exact; color-adjust: exact; }
              .no-break { page-break-inside: avoid; }
              .page-break { page-break-before: always; }
            }
          `}
        </style>
        <header className="mb-8 border-b pb-4 text-center no-break">
          <h1 className="text-3xl font-bold text-gray-900">Ficha de Visita Técnica de SST</h1>
          <p className="text-sm text-gray-600">Service Flow Dashboard</p>
        </header>

        {/* SEÇÃO 1 e 2 */}
        <section className="mb-6 no-break">
          <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Seção 1 e 2: Identificação da Visita e Dados do Cliente</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><p className="font-medium text-gray-600">Empresa:</p><p className="font-semibold">{service.nomeEmpresa}</p></div>
            <div><p className="font-medium text-gray-600">CNPJ:</p><p>{service.cnpj}</p></div>
            <div><p className="font-medium text-gray-600">Data da Visita:</p><p>{service.dataAgendamento ? format(new Date(service.dataAgendamento.seconds * 1000), 'dd/MM/yyyy', { locale: ptBR }) : 'Não agendado'}</p></div>
            <div><p className="font-medium text-gray-600">Técnico Responsável:</p><p>{service.tecnico || '-'}</p></div>
            <div><p className="font-medium text-gray-600">Hora de Término:</p><p>{ficha.horaTermino || '-'}</p></div>
            <div><p className="font-medium text-gray-600">Tipo de Visita:</p><p>{ficha.tipoVisita || '-'}</p></div>
            <div className="col-span-2"><p className="font-medium text-gray-600">Endereço:</p><p>{`${service.endereco}, ${service.bairro}, ${service.cidade}`}</p></div>
            <div><p className="font-medium text-gray-600">Setor Inspecionado:</p><p>{ficha.setorInspecionado || '-'}</p></div>
            <div><p className="font-medium text-gray-600">Acompanhante:</p><p>{`${ficha.responsavelEmpresa || '-'} (${ficha.cargoResponsavel || 'Cargo não informado'})`}</p></div>
            <div className="col-span-2"><p className="font-medium text-gray-600">Objetivo:</p><p>{ficha.objetivoPrincipal || '-'}</p></div>
          </div>
        </section>

        <Separator className="my-8" />
        
        {/* SEÇÃO 3: PGR */}
        <section className="mb-6 no-break">
           <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Seção 3: Análise para o PGR (NR-1)</h2>
            <div className="space-y-4 text-sm">
              <div><p className="font-medium text-gray-600">Descrição do Ambiente:</p><p>{ficha.descricaoAmbiente || 'Não informado.'}</p></div>
              <div><p className="font-medium text-gray-600">Descrição dos Processos:</p><p>{ficha.descricaoProcessos || 'Não informado.'}</p></div>
              <div className="grid grid-cols-2 gap-x-8">
                <div><p className="font-medium text-gray-600">População Exposta:</p><p>{ficha.populacaoExposta || '-'}</p></div>
                <div><p className="font-medium text-gray-600">Funções no Setor:</p><p>{ficha.funcoesPresentes || '-'}</p></div>
              </div>
            </div>
            {ficha.pgrRiscos && ficha.pgrRiscos.length > 0 && (
              <div className="mt-4 no-break">
                <h3 className="mb-2 font-semibold text-gray-700">Identificação de Perigos e Avaliação de Riscos</h3>
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">Perigo</th><th className="p-2">Fonte</th><th className="p-2">Risco</th><th className="p-2">Funções Expostas</th><th className="p-2">Controles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ficha.pgrRiscos.map((risco: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{risco.perigo}</td><td className="p-2">{risco.fonte}</td><td className="p-2">{risco.risco}</td><td className="p-2">{risco.funcoesExpostas}</td><td className="p-2">{risco.controles}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>

        <Separator className="my-8" />

        {/* SEÇÃO 4: LTCAT */}
        <section className="mb-6 no-break">
          <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Seção 4: Análise para o LTCAT</h2>
           <div className="space-y-4 text-sm">
              <div><p className="font-medium text-gray-600">Houve Mudança de Layout?:</p><p className='capitalize'>{ficha.mudancaLayout || 'Não informado.'}</p></div>
              <div><p className="font-medium text-gray-600">Descrição da Atividade para Análise Previdenciária:</p><p>{ficha.descricaoAtividadeLTCAT || 'Não informado.'}</p></div>
              <div className="grid grid-cols-2 gap-x-8">
                <div><p className="font-medium text-gray-600">Eficácia EPC:</p><p>{ficha.eficaciaEPC || '-'}</p></div>
                <div><p className="font-medium text-gray-600">Eficácia EPI:</p><p>{ficha.eficaciaEPI || '-'}</p></div>
              </div>
              <div><p className="font-medium text-gray-600">Observações sobre EPI:</p><p>{ficha.observacoesEPI || 'Não informado.'}</p></div>
            </div>
            {ficha.ltcatAgentes && ficha.ltcatAgentes.length > 0 && (
              <div className="mt-4 no-break">
                <h3 className="mb-2 font-semibold text-gray-700">Avaliação de Agentes Nocivos</h3>
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">Agente</th><th className="p-2">Análise</th><th className="p-2">Resultado</th><th className="p-2">Limite</th><th className="p-2">Acima do Limite?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ficha.ltcatAgentes.map((agente: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{agente.agente}</td><td className="p-2">{agente.analise}</td><td className="p-2">{agente.resultado}</td><td className="p-2">{agente.limite}</td><td className="p-2 capitalize">{agente.conclusao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>

        <Separator className="my-8" />
        
        {/* SEÇÃO 5: CHECKLIST */}
        <section className="mb-6 page-break">
            <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Seção 5: Checklist Geral de Conformidade</h2>
            {ficha.checklist && ficha.checklist.length > 0 && (
              <div className="mt-4 no-break">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 w-[20%]">Categoria</th><th className="p-2 w-[40%]">Item</th><th className="p-2">Status</th><th className="p-2">Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ficha.checklist.map((item: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.categoria}</td><td className="p-2">{item.item}</td><td className="p-2"><Badge variant={item.status === 'C' ? 'success' : item.status === 'NC' ? 'destructive' : 'secondary'}>{statusChecklist[item.status]?.label || item.status}</Badge></td><td className="p-2">{item.observacoes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>

        <Separator className="my-8" />

        {/* SEÇÃO 6: PLANO DE AÇÃO */}
        <section className="mb-6 no-break">
            <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Seção 6: Plano de Ação (Não Conformidades)</h2>
            {ficha.planoAcao && ficha.planoAcao.length > 0 && (
              <div className="mt-4 no-break">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">Descrição</th><th className="p-2">Risco</th><th className="p-2">Recomendação</th><th className="p-2">Prazo</th><th className="p-2">Responsável</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ficha.planoAcao.map((item: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.descricao}</td><td className="p-2 capitalize">{item.risco}</td><td className="p-2">{item.recomendacao}</td><td className="p-2">{item.prazo ? format(new Date(item.prazo), 'dd/MM/yyyy') : '-'}</td><td className="p-2">{item.responsavel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>

        <Separator className="my-8" />

        {/* SEÇÃO 7: CONCLUSÃO */}
        <section className="mb-6 no-break">
            <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Seção 7: Conclusão</h2>
            <div className="space-y-4 text-sm">
              <div><p className="font-medium text-gray-600">Parecer Técnico Geral:</p><p>{ficha.parecerTecnico || 'Não informado.'}</p></div>
              <div><p className="font-medium text-gray-600">Pendências:</p><p>{ficha.pendencias || 'Nenhuma.'}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-24 text-center">
                <div className="border-t pt-2">
                    <p className="font-semibold">{service.tecnico || 'Técnico Responsável'}</p>
                    <p className="text-xs">Assinatura do Técnico</p>
                </div>
                <div className="border-t pt-2">
                     <p className="font-semibold">{ficha.responsavelEmpresa || 'Responsável da Empresa'}</p>
                     <p className="text-xs">Assinatura do Responsável da Empresa</p>
                </div>
            </div>
        </section>
        
        <footer className="mt-12 pt-4 border-t text-center text-xs text-gray-500 no-break">
            <p>Documento gerado por Service Flow Dashboard em {format(new Date(), "'em' dd/MM/yyyy 'às' HH:mm")}</p>
        </footer>
      </div>
    );
  }
);

PrintableServiceCard.displayName = 'PrintableServiceCard';

    