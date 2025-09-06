
'use client';

import type { FichaVisita, Service } from '@/app/(main)/engenharia/page';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';
import { Separator } from './ui/separator';

interface PrintableServiceCardProps {
  service: Service;
}

const statusMap = { c: 'Conforme', nc: 'Não Conforme', na: 'Não se Aplica' };
const tipoInspecaoMap = {
  rotina: 'Rotina',
  denuncia: 'Denúncia',
  especifica: 'Específica',
  oficial: 'Oficial',
};


const renderItensVerificacao = (ficha: FichaVisita) => {
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

    return (
        <table className="w-full border-collapse text-xs">
            <thead>
                <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Item a ser Verificado</th>
                    <th className="border p-2 text-center w-16">C</th>
                    <th className="border p-2 text-center w-16">NC</th>
                    <th className="border p-2 text-center w-16">NA</th>
                    <th className="border p-2 text-left">Observações / Ações Corretivas</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(checklistItems).map(([category, items]) => (
                    <React.Fragment key={category}>
                        <tr>
                            <td colSpan={5} className="font-bold bg-gray-50 p-2 border">{category}</td>
                        </tr>
                        {items.map((item, index) => {
                             const verificacao = ficha.itensVerificacao?.[item];
                             return (
                                <tr key={index}>
                                    <td className="border p-2">{item}</td>
                                    <td className="border p-2 text-center font-bold">{verificacao?.status === 'c' ? 'X' : ''}</td>
                                    <td className="border p-2 text-center font-bold">{verificacao?.status === 'nc' ? 'X' : ''}</td>
                                    <td className="border p-2 text-center font-bold">{verificacao?.status === 'na' ? 'X' : ''}</td>
                                    <td className="border p-2">{verificacao?.observacoes || ''}</td>
                                </tr>
                             )
                        })}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
    );
};

export const PrintableServiceCard = React.forwardRef<HTMLDivElement, PrintableServiceCardProps>(
  ({ service }, ref) => {
    const sortedFichas = service.fichasVisita 
      ? [...service.fichasVisita].sort((a, b) => b.dataPreenchimento.seconds - a.dataPreenchimento.seconds) 
      : [];
      
    const formatFichaDate = (date: any) => {
      if (!date) return '-';
      // Handle both firebase timestamp and date objects from the form
      const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
      return format(d, 'dd/MM/yyyy', { locale: ptBR });
    }

    return (
      <div ref={ref} className="p-4 sm:p-8 font-sans text-gray-800 bg-white">
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
        <header className="mb-8 border-b pb-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Ficha de Ordem de Serviço</h1>
          <p className="text-sm text-gray-600">Service Flow Dashboard</p>
        </header>

        <section className="mb-6 no-break">
          <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Dados da Empresa</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><p className="font-medium text-gray-600">Nome da Empresa:</p><p className="font-semibold">{service.nomeEmpresa}</p></div>
            <div><p className="font-medium text-gray-600">CNPJ:</p><p>{service.cnpj}</p></div>
            <div><p className="font-medium text-gray-600">Contato:</p><p>{service.contato}</p></div>
            <div><p className="font-medium text-gray-600">Telefone:</p><p>{service.telefone}</p></div>
            <div><p className="font-medium text-gray-600">Email:</p><p>{service.email || 'Não informado'}</p></div>
            <div><p className="font-medium text-gray-600">Endereço:</p><p>{`${service.endereco}, ${service.bairro}, ${service.cidade}`}</p></div>
          </div>
        </section>

        {sortedFichas.map((ficha, index) => (
          <React.Fragment key={index}>
            <div className={index > 0 ? "page-break" : ""}></div>
            <section className="mb-6 no-break">
              <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Ficha de Inspeção de Segurança - {formatFichaDate(ficha.dataPreenchimento)}</h2>
              
              {/* Seção 1: Identificação */}
              <div className="mb-4 p-4 border rounded-lg">
                <h3 className="font-bold mb-2 text-lg">1. Identificação da Inspeção</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div><p className="font-medium">Setor/Área:</p><p>{ficha.setorInspecionado}</p></div>
                  <div><p className="font-medium">Data da Vistoria:</p><p>{formatFichaDate(ficha.dataVistoria)}</p></div>
                  <div><p className="font-medium">Horário:</p><p>{ficha.horario}</p></div>
                  <div><p className="font-medium">Responsável (Técnico):</p><p>{ficha.tecnico}</p></div>
                  <div><p className="font-medium">Acompanhante(s):</p><p>{ficha.acompanhante}</p></div>
                  <div><p className="font-medium">Tipo de Inspeção:</p><p>{tipoInspecaoMap[ficha.tipoInspecao]}</p></div>
                </div>
              </div>

              {/* Seção 2: Itens de Verificação */}
              <div className="mb-4 p-4 border rounded-lg no-break">
                 <h3 className="font-bold mb-2 text-lg">2. Itens de Verificação</h3>
                 {renderItensVerificacao(ficha)}
              </div>

              {/* Seção 3: Não Conformidades */}
              {ficha.naoConformidades && ficha.naoConformidades.length > 0 && (
                <div className="mb-4 p-4 border rounded-lg no-break">
                    <h3 className="font-bold mb-2 text-lg">3. Descrição de Não Conformidades e Recomendações</h3>
                    {ficha.naoConformidades.map((nc, ncIndex) => (
                        <div key={ncIndex} className="p-3 border-t mt-2">
                             <p className="font-semibold">Não Conformidade {ncIndex + 1}</p>
                             <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                <div className="col-span-2"><p className="font-medium">Descrição:</p><p>{nc.descricao}</p></div>
                                <div><p className="font-medium">Risco Associado:</p><p>{nc.riscoAssociado}</p></div>
                                <div><p className="font-medium">Recomendação:</p><p>{nc.recomendacao}</p></div>
                                <div><p className="font-medium">Prazo para Correção:</p><p>{formatFichaDate(nc.prazo)}</p></div>
                                <div><p className="font-medium">Responsável pela Ação:</p><p>{nc.responsavelAcao}</p></div>
                             </div>
                        </div>
                    ))}
                </div>
              )}
               
              {/* Seção 4: Assinaturas */}
              <div className="p-4 border rounded-lg no-break">
                <h3 className="font-bold mb-8 text-lg">4. Conclusão e Assinaturas</h3>
                <div className="grid grid-cols-2 gap-8 pt-12">
                  <div className="text-center">
                    <div className="border-t border-gray-400 w-full mx-auto"></div>
                    <p className="mt-2 text-xs">Assinatura do Responsável pela Vistoria</p>
                    <p className="text-xs font-semibold">{ficha.tecnico}</p>
                  </div>
                   <div className="text-center">
                    <div className="border-t border-gray-400 w-full mx-auto"></div>
                    <p className="mt-2 text-xs">Assinatura do Responsável pela Área</p>
                    <p className="text-xs font-semibold">{ficha.acompanhante}</p>
                  </div>
                </div>
              </div>

            </section>
            {index < sortedFichas.length - 1 && <Separator className="my-6" />}
          </React.Fragment>
        ))}


        <footer className="mt-12 pt-4 border-t text-center text-xs text-gray-500">
            <p>Documento gerado por Service Flow Dashboard em {format(new Date(), "'em' dd/MM/yyyy 'às' HH:mm")}</p>
        </footer>
      </div>
    );
  }
);

PrintableServiceCard.displayName = 'PrintableServiceCard';
