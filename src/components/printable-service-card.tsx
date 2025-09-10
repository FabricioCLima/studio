
'use client';

import type { Assinatura, FichaVisita, Service, NaoConformidadeDetalhada, ChecklistItem } from '@/app/(main)/engenharia/page';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';
import { Separator } from './ui/separator';

interface PrintableServiceCardProps {
  service: Service;
}

const tipoVisitaMap = {
    rotina: 'Rotina',
    investigacao: 'Investigação de Acidente/Incidente',
    auditoria: 'Auditoria',
    fiscalizacao: 'Atendimento à Fiscalização',
    outro: 'Outro',
};

const riscoMap = {
    baixo: 'Baixo',
    medio: 'Médio',
    alto: 'Alto',
};


const formatFichaDate = (date: any) => {
    if (!date) return '-';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    try {
        return format(d, 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
        return '-'
    }
}

const formatFichaDateTime = (date: any) => {
    if (!date) return '-';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
     try {
        return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
        return '-'
    }
}

const AssinaturaPrint = ({ assinatura, label, nome }: { assinatura?: Assinatura | null, label: string, nome?: string | null }) => {
    return (
         <div className="text-center mt-12 pt-4">
            {assinatura ? (
                <p className="font-serif text-lg mb-2">{assinatura.nome}</p>
            ) : (
                <div className="h-10"></div>
            )}
            <div className="border-t border-gray-400 w-full mx-auto"></div>
            <p className="mt-2 text-xs">{label}</p>
            {assinatura?.nome ? <p className="text-xs font-bold">{assinatura.nome}</p> : <p className="text-xs font-bold">{nome}</p>}
            {assinatura && <p className="text-xs text-gray-500">Assinado digitalmente em {formatFichaDateTime(assinatura.data)}</p>}
        </div>
    )
}

const renderChecklist = (checklist: { [key: string]: ChecklistItem }) => {
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

    return (
        <table className="w-full border-collapse text-xs">
            <thead>
                <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Item a ser Verificado</th>
                    <th className="border p-2 text-center w-10">C</th>
                    <th className="border p-2 text-center w-10">NC</th>
                    <th className="border p-2 text-center w-10">NA</th>
                    <th className="border p-2 text-left">Observações</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(checklistItems).map(([category, items]) => (
                    <React.Fragment key={category}>
                        <tr>
                            <td colSpan={5} className="font-bold bg-gray-50 p-2 border">{category}</td>
                        </tr>
                        {items.map((item, index) => {
                             const verificacao = checklist?.[item];
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

const renderChecklistPgr = (checklist: FichaVisita['pgr']['checklistPGR']) => {
    if (!checklist) return null;
    const checklistItems = {
        'Riscos Físicos': [ 'Ruído: Fontes de ruído identificadas? Proteção auditiva disponível e em uso?', 'Calor/Frio: Ambiente com temperatura controlada? EPIs para condições térmicas extremas?', 'Vibrações: Equipamentos que geram vibração (mãos/braços, corpo inteiro) estão com manutenção em dia?', 'Radiações (Ionizantes/Não Ionizantes): Fontes de radiação isoladas? Sinalização adequada?'],
        'Riscos Químicos': [ 'Produtos Químicos: Armazenamento correto (longe de calor, ventilado)?', 'FISPQ/FDS: Ficha de Informação de Segurança de Produtos Químicos disponível e acessível a todos?', 'EPIs: Trabalhadores usam luvas, máscaras e óculos adequados para os produtos manuseados?', 'Ventilação: Sistema de exaustão/ventilação funcionando corretamente?'],
        'Riscos Biológicos': [ 'Materiais Contaminados: Descarte de resíduos (lixo hospitalar, etc.) feito em local apropriado?', 'Limpeza e Higienização: Procedimentos de limpeza sendo seguidos?', 'Controle de Pragas: Existe evidência de vetores (insetos, roedores)?'],
        'Riscos Ergonômicos': [ 'Postura: Mobiliário (cadeiras, mesas) ajustado ao trabalhador?', 'Levantamento de Peso: Técnicas corretas sendo aplicadas? Há auxílio de equipamentos?', 'Ritmo de Trabalho: Pausas para descanso estão sendo cumpridas?', 'Iluminação: Iluminação do posto de trabalho é adequada (nem fraca, nem ofuscante)?'],
        'Riscos de Acidentes (Mecânicos)': [ 'Máquinas e Equipamentos: Proteções de partes móveis (correias, polias) estão instaladas e intactas?', 'Instalações Elétricas: Fios expostos? Quadros elétricos sinalizados e desobstruídos?', 'Prevenção de Incêndio: Extintores dentro da validade, sinalizados e desobstruídos? Saídas de emergência livres?', 'Arranjo Físico (Layout): Corredores de circulação estão livres de obstáculos?', 'Trabalho em Altura: Uso de cinto de segurança, andaimes seguros, linha de vida?'],
    };

    return (
        <table className="w-full border-collapse text-xs">
            <thead>
                <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Item de Verificação de Riscos</th>
                    <th className="border p-2 text-center w-10">C</th>
                    <th className="border p-2 text-center w-10">NC</th>
                    <th className="border p-2 text-center w-10">NA</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(checklistItems).map(([category, items]) => (
                    <React.Fragment key={category}>
                        <tr>
                            <td colSpan={4} className="font-bold bg-gray-50 p-2 border">{category}</td>
                        </tr>
                        {items.map((item, index) => {
                            const verificacao = checklist?.[item];
                            return (
                                <tr key={index}>
                                    <td className="border p-2">{item}</td>
                                    <td className="border p-2 text-center font-bold">{verificacao?.status === 'c' ? 'X' : ''}</td>
                                    <td className="border p-2 text-center font-bold">{verificacao?.status === 'nc' ? 'X' : ''}</td>
                                    <td className="border p-2 text-center font-bold">{verificacao?.status === 'na' ? 'X' : ''}</td>
                                </tr>
                            )
                        })}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
    );
};


const FichaVisitaPrint = ({ ficha, service }: { ficha: FichaVisita, service: Service }) => (
    <div className="no-break">
        <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Ficha de Inspeção - {formatFichaDate(ficha.dataVisita)}</h2>
        
        <section className="mb-4 p-4 border rounded-lg no-break">
            <h3 className="font-bold mb-2 text-lg">Seção 1: Identificação da Visita</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><p className="font-medium">ID da Visita:</p><p>{ficha.id}</p></div>
                <div><p className="font-medium">Data da Visita:</p><p>{formatFichaDate(ficha.dataVisita)}</p></div>
                <div><p className="font-medium">Hora de Início:</p><p>{ficha.horaInicio}</p></div>
                <div><p className="font-medium">Hora de Término:</p><p>{ficha.horaTermino}</p></div>
                <div><p className="font-medium">Técnico Responsável:</p><p>{ficha.tecnicoResponsavel}</p></div>
                <div className="col-span-2"><p className="font-medium">Tipo de Visita:</p><p>{tipoVisitaMap[ficha.tipoVisita]}</p></div>
                <div className="col-span-2"><p className="font-medium">Objetivo da Visita:</p><p>{ficha.objetivoVisita}</p></div>
            </div>
        </section>

        <section className="mb-4 p-4 border rounded-lg no-break">
            <h3 className="font-bold mb-2 text-lg">Seção 2: Dados da Empresa Inspecionada</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><p className="font-medium">Razão Social:</p><p>{service.nomeEmpresa}</p></div>
                <div><p className="font-medium">CNPJ:</p><p>{service.cnpj}</p></div>
                <div className="col-span-2"><p className="font-medium">Endereço:</p><p>{`${service.endereco}, ${service.bairro}, ${service.cidade}`}</p></div>
                <div><p className="font-medium">Setor Inspecionado:</p><p>{ficha.setorInspecionado}</p></div>
                <div><p className="font-medium">Responsável (Acompanhante):</p><p>{ficha.responsavelEmpresa}</p></div>
                <div><p className="font-medium">Cargo:</p><p>{ficha.cargoResponsavel}</p></div>
                <div><p className="font-medium">Contato:</p><p>{ficha.contatoResponsavel}</p></div>
            </div>
        </section>

        <section className="mb-4 p-4 border rounded-lg no-break">
            <h3 className="font-bold mb-2 text-lg">Seção 3: Checklist de Conformidade</h3>
            {renderChecklist(ficha.checklist)}
        </section>

        {ficha.naoConformidades && ficha.naoConformidades.length > 0 && (
        <section className="mb-4 p-4 border rounded-lg no-break">
            <h3 className="font-bold mb-2 text-lg">Seção 4: Registro de Não Conformidades e Recomendações</h3>
            {ficha.naoConformidades.map((nc) => (
                <div key={nc.id} className="p-3 border-t mt-2 first:border-t-0 first:mt-0">
                        <p className="font-semibold">{nc.id}</p>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                            <div className="col-span-2"><p className="font-medium">Descrição:</p><p>{nc.descricao}</p></div>
                            <div><p className="font-medium">Risco Associado:</p><p>{riscoMap[nc.riscoAssociado]}</p></div>
                            <div><p className="font-medium">Norma (NR):</p><p>{nc.normaRegulamentadora}</p></div>
                            <div className="col-span-2"><p className="font-medium">Recomendação:</p><p>{nc.recomendacao}</p></div>
                            <div><p className="font-medium">Prazo para Correção:</p><p>{formatFichaDate(nc.prazo)}</p></div>
                            <div><p className="font-medium">Responsável (Empresa):</p><p>{nc.responsavel}</p></div>
                        </div>
                </div>
            ))}
        </section>
        )}

        <section className="mb-4 p-4 border rounded-lg no-break">
            <h3 className="font-bold mb-2 text-lg">Seção 5: Observações Gerais e Conclusão</h3>
            <div className="text-sm space-y-3">
                <div><p className="font-medium">Pontos Positivos:</p><p>{ficha.pontosPositivos || 'Nenhum ponto positivo observado.'}</p></div>
                <div><p className="font-medium">Outras Observações:</p><p>{ficha.outrasObservacoes || 'Nenhuma observação adicional.'}</p></div>
                <div><p className="font-medium">Parecer Geral do Técnico:</p><p>{ficha.parecerTecnico || 'Nenhum parecer fornecido.'}</p></div>
            </div>
        </section>

        {ficha.pgr && (
            <section className="mb-6 no-break">
                <div className="page-break"></div>
                <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Anexo: Avaliação de Riscos (PGR)</h2>
                 <div className="mb-4 p-4 border rounded-lg">
                    <h3 className="font-bold mb-2 text-lg">1. Detalhes da Vistoria PGR</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div><p className="font-medium">N° da Vistoria:</p><p>{ficha.pgr.numeroVistoria}</p></div>
                        <div className="col-span-2"><p className="font-medium">Atividade/Equipamento:</p><p>{ficha.pgr.atividade}</p></div>
                        <div><p className="font-medium">Responsável Vistoria:</p><p>{ficha.pgr.responsavelVistoria}</p></div>
                        <div><p className="font-medium">Acompanhante(s):</p><p>{ficha.pgr.acompanhantes}</p></div>
                    </div>
                </div>
                <div className="mb-4 p-4 border rounded-lg no-break">
                    <h3 className="font-bold mb-2 text-lg">2. Checklist de Verificação de Riscos (PGR)</h3>
                    {renderChecklistPgr(ficha.pgr.checklistPGR)}
                </div>
                {ficha.pgr.planoAcao && ficha.pgr.planoAcao.length > 0 && (
                    <div className="mb-4 p-4 border rounded-lg no-break">
                        <h3 className="font-bold mb-2 text-lg">3. Plano de Ação (PGR)</h3>
                        {ficha.pgr.planoAcao.map((acao, index) => (
                            <div key={index} className="p-3 border-t mt-2 first:mt-0 first:border-t-0">
                                <p className="font-semibold">Ação Corretiva {index + 1}</p>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                    <div className="col-span-2"><p className="font-medium">Não Conformidade:</p><p>{acao.descricaoNaoConformidade}</p></div>
                                    <div className="col-span-2"><p className="font-medium">Ação Corretiva:</p><p>{acao.acaoCorretiva}</p></div>
                                    <div><p className="font-medium">Nível de Risco:</p><p className="capitalize">{acao.nivelRisco}</p></div>
                                    <div><p className="font-medium">Prazo:</p><p>{formatFichaDate(acao.prazo)}</p></div>
                                    <div><p className="font-medium">Responsável:</p><p>{acao.responsavel}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        )}

        {ficha.ltcat && (
             <section className="mb-6 no-break">
                <div className="page-break"></div>
                <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Anexo: Caracterização Ambiental (LTCAT)</h2>
                {/* LTCAT Print Content */}
                 <p className='text-sm text-gray-500 p-4'>Conteúdo de impressão para LTCAT a ser implementado.</p>
            </section>
        )}

        <section className="p-4 rounded-lg no-break">
            <h3 className="font-bold mb-8 text-lg">Seção 6: Finalização e Assinaturas</h3>
            <p className="text-sm text-center mb-8">{ficha.localData}</p>
            <div className="grid grid-cols-2 gap-8 pt-12">
                <AssinaturaPrint assinatura={ficha.assinaturaTecnico} label="Assinatura do Técnico Responsável" nome={ficha.tecnicoResponsavel} />
                <AssinaturaPrint assinatura={ficha.assinaturaResponsavel} label="Assinatura do Responsável pela Empresa" nome={ficha.responsavelEmpresa} />
            </div>
        </section>
    </div>
);



export const PrintableServiceCard = React.forwardRef<HTMLDivElement, PrintableServiceCardProps>(
  ({ service }, ref) => {
    const sortedFichasVisita = service.fichasVisita 
      ? [...service.fichasVisita].sort((a, b) => (a.dataPreenchimento?.seconds ?? 0) - (b.dataPreenchimento?.seconds ?? 0)) 
      : [];

    const hasAnyFicha = sortedFichasVisita.length > 0;

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
        <header className="mb-8 border-b pb-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Relatório de Vistoria Técnica</h1>
          <p className="text-sm text-gray-600">Service Flow Dashboard</p>
        </header>

        <section className="mb-6 no-break">
          <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Dados da Empresa</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><p className="font-medium text-gray-600">Nome da Empresa:</p><p className="font-semibold">{service.nomeEmpresa}</p></div>
            <div><p className="font-medium text-gray-600">CNPJ:</p><p>{service.cnpj}</p></div>
            <div><p className="font-medium text-gray-600">Contato:</p><p>{service.contato}</p></div>
            <div><p className="font-medium text-gray-600">Telefone:</p><p>{service.telefone}</p></div>
            <div className="col-span-2"><p className="font-medium text-gray-600">Endereço:</p><p>{`${service.endereco}, ${service.bairro}, ${service.cidade}`}</p></div>
          </div>
        </section>
        
        <Separator className="my-8" />

        {!hasAnyFicha && (
            <div className="text-center text-gray-500">
                <p>Nenhuma ficha de vistoria foi encontrada para este serviço.</p>
            </div>
        )}

        {sortedFichasVisita.map((ficha, index) => (
          <React.Fragment key={ficha.id}>
            {index > 0 && <div className="page-break"></div>}
             <FichaVisitaPrint ficha={ficha} service={service} />
          </React.Fragment>
        ))}

        <footer className="mt-12 pt-4 border-t text-center text-xs text-gray-500 no-break">
            <p>Documento gerado por Service Flow Dashboard em {format(new Date(), "'em' dd/MM/yyyy 'às' HH:mm")}</p>
        </footer>
      </div>
    );
  }
);

PrintableServiceCard.displayName = 'PrintableServiceCard';
