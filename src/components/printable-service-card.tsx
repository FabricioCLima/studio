
'use client';

import type { Assinatura, FichaLTCAT, FichaPGR, FichaVisita, Service } from '@/app/(main)/engenharia/page';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';
import { Separator } from './ui/separator';

interface PrintableServiceCardProps {
  service: Service;
}

const tipoInspecaoMap = {
  rotina: 'Rotina',
  denuncia: 'Denúncia',
  especifica: 'Específica',
  oficial: 'Oficial',
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
    if (assinatura) {
        return (
             <div className="text-center">
                <p className="font-serif text-lg mb-2">{assinatura.nome}</p>
                <div className="border-t border-gray-400 w-full mx-auto"></div>
                <p className="mt-2 text-xs">{label}</p>
                <p className="text-xs text-gray-500">Assinado digitalmente em {formatFichaDateTime(assinatura.data)}</p>
            </div>
        )
    }
    return (
        <div className="text-center">
            <div className="border-t border-gray-400 w-full mx-auto"></div>
            <p className="mt-2 text-xs">{label}</p>
            {nome && <p className="text-xs font-semibold">{nome}</p>}
        </div>
    )
}

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

const FichaVisitaPrint = ({ ficha }: { ficha: FichaVisita }) => (
    <section className="mb-6 no-break">
        <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Ficha de Inspeção de Segurança - {formatFichaDate(ficha.dataPreenchimento)}</h2>
        
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

        <div className="mb-4 p-4 border rounded-lg no-break">
            <h3 className="font-bold mb-2 text-lg">2. Itens de Verificação</h3>
            {renderItensVerificacao(ficha)}
        </div>

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
        
        <div className="p-4 border rounded-lg no-break">
        <h3 className="font-bold mb-8 text-lg">4. Conclusão e Assinaturas</h3>
        <div className="grid grid-cols-2 gap-8 pt-12">
             <AssinaturaPrint label="Assinatura do Responsável pela Vistoria" nome={ficha.tecnico} />
             <AssinaturaPrint assinatura={ficha.assinaturaResponsavelArea} label="Assinatura do Responsável pela Área" nome={ficha.acompanhante} />
        </div>
        </div>
    </section>
);


const FichaPgrPrint = ({ ficha }: { ficha: FichaPGR }) => (
    <section className="mb-6 no-break">
        <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Ficha de Vistoria de Riscos (PGR) - {formatFichaDate(ficha.dataPreenchimento)}</h2>

        <div className="mb-4 p-4 border rounded-lg">
            <h3 className="font-bold mb-2 text-lg">1. Identificação da Inspeção</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><p className="font-medium">N° da Vistoria:</p><p>{ficha.numeroVistoria}</p></div>
                <div><p className="font-medium">Data:</p><p>{formatFichaDate(ficha.dataVistoria)} às {ficha.horario}</p></div>
                <div className="col-span-2"><p className="font-medium">Setor/Departamento:</p><p>{ficha.setor}</p></div>
                <div className="col-span-2"><p className="font-medium">Atividade/Equipamento:</p><p>{ficha.atividade}</p></div>
                <div><p className="font-medium">Responsável Vistoria:</p><p>{ficha.responsavelVistoria}</p></div>
                <div><p className="font-medium">Acompanhante(s):</p><p>{ficha.acompanhantes}</p></div>
            </div>
        </div>

        {ficha.planoAcao && ficha.planoAcao.length > 0 && (
            <div className="mb-4 p-4 border rounded-lg no-break">
                <h3 className="font-bold mb-2 text-lg">2. Plano de Ação</h3>
                {ficha.planoAcao.map((acao, index) => (
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

        <div className="p-4 border rounded-lg no-break">
            <h3 className="font-bold mb-8 text-lg">3. Assinaturas</h3>
            <div className="grid grid-cols-2 gap-8 pt-12">
                <AssinaturaPrint label="Assinatura do Responsável pela Vistoria" nome={ficha.responsavelVistoria} />
                <AssinaturaPrint assinatura={ficha.assinaturaResponsavelArea} label="Assinatura do Responsável pelo Setor/Área" nome={ficha.acompanhantes} />
            </div>
        </div>
    </section>
);

const FichaLtcatPrint = ({ ficha, service }: { ficha: FichaLTCAT, service: Service }) => (
    <section className="mb-6 no-break">
        <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Ficha de Campo LTCAT - {formatFichaDate(ficha.dataPreenchimento)}</h2>

        <div className="mb-4 p-4 border rounded-lg">
            <h3 className="font-bold mb-2 text-lg">1. DADOS GERAIS DA AVALIAÇÃO</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><p className="font-medium">Empresa:</p><p>{service.nomeEmpresa}</p></div>
                <div><p className="font-medium">CNPJ:</p><p>{service.cnpj}</p></div>
                <div className="col-span-2"><p className="font-medium">Endereço:</p><p>{`${service.endereco}, ${service.bairro} - ${service.cidade}`}</p></div>
                <div><p className="font-medium">CNAE:</p><p>{ficha.cnae}</p></div>
                <div><p className="font-medium">Data da Vistoria:</p><p>{formatFichaDate(ficha.dataVistoria)} às {ficha.horario}</p></div>
                <div><p className="font-medium">Responsável Vistoria:</p><p>{ficha.responsavelVistoria}</p></div>
                <div><p className="font-medium">Acompanhante:</p><p>{ficha.acompanhante}</p></div>
            </div>
        </div>

        <div className="mb-4 p-4 border rounded-lg no-break">
            <h3 className="font-bold mb-2 text-lg">2. CARACTERIZAÇÃO DO AMBIENTE E DA FUNÇÃO</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><p className="font-medium">Setor/Departamento:</p><p>{ficha.setor}</p></div>
                <div><p className="font-medium">GHE:</p><p>{ficha.ghe}</p></div>
                <div className="col-span-2"><p className="font-medium">Função(ões):</p><p>{ficha.funcoes}</p></div>
                <div><p className="font-medium">N° Trabalhadores:</p><p>H: {ficha.homens}, M: {ficha.mulheres}, Total: {ficha.totalTrabalhadores}</p></div>
                <div><p className="font-medium">Jornada:</p><p>{ficha.jornadaTrabalho}</p></div>
                <div><p className="font-medium">Frequência Exposição:</p><p className="capitalize">{ficha.frequenciaExposicao}</p></div>
                <div className="col-span-2"><p className="font-medium">Descrição Atividades:</p><p className="whitespace-pre-wrap">{ficha.descricaoAtividades}</p></div>
                <div className="col-span-2"><p className="font-medium">Arranjo Físico:</p><p className="whitespace-pre-wrap">{ficha.arranjoFisico}</p></div>
                <div className="col-span-2"><p className="font-medium">Equipamentos:</p><p className="whitespace-pre-wrap">{ficha.equipamentos}</p></div>
            </div>
        </div>

        <div className="mb-4 p-4 border rounded-lg no-break">
             <h3 className="font-bold mb-2 text-lg">3. AVALIAÇÃO DE AGENTES NOCIVOS</h3>
             
             {ficha.agentesFisicos && ficha.agentesFisicos.filter(a => a.resultado).length > 0 && <>
                <h4 className="font-semibold mt-4 mb-2 text-base">A. Agentes Físicos</h4>
                <table className="w-full border-collapse text-xs">
                    <thead><tr className="bg-gray-100">
                        <th className="border p-1 text-left">Agente</th><th className="border p-1 text-left">Fonte</th><th className="border p-1 text-left">Instrumento</th><th className="border p-1 text-left">Resultado</th>
                    </tr></thead>
                    <tbody>
                        {ficha.agentesFisicos.filter(a => a.resultado).map((agente, i) => (
                            <tr key={i}>
                                <td className="border p-1">{agente.agente}</td>
                                <td className="border p-1">{agente.fonteGeradora}</td>
                                <td className="border p-1">{agente.instrumento}</td>
                                <td className="border p-1">{agente.resultado}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </>}

            {ficha.agentesQuimicos && ficha.agentesQuimicos.filter(a => a.resultado).length > 0 && (
                <>
                    <h4 className="font-semibold mt-4 mb-2 text-base">B. Agentes Químicos</h4>
                    <table className="w-full border-collapse text-xs">
                         <thead><tr className="bg-gray-100">
                            <th className="border p-1 text-left">Agente</th><th className="border p-1 text-left">Fonte</th><th className="border p-1 text-left">Resultado</th>
                        </tr></thead>
                        <tbody>
                            {ficha.agentesQuimicos.filter(a => a.resultado).map((agente, i) => (
                                <tr key={i}>
                                    <td className="border p-1">{agente.agente}</td>
                                    <td className="border p-1">{agente.fonteGeradora}</td>
                                    <td className="border p-1">{agente.resultado}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {ficha.agentesBiologicos && ficha.agentesBiologicos.filter(a => a.descricao).length > 0 && (
                 <>
                    <h4 className="font-semibold mt-4 mb-2 text-base">C. Agentes Biológicos</h4>
                     <table className="w-full border-collapse text-xs">
                         <thead><tr className="bg-gray-100">
                            <th className="border p-1 text-left">Descrição Atividade</th><th className="border p-1 text-left">Agente Provável</th><th className="border p-1 text-center">Enquadrado</th>
                        </tr></thead>
                        <tbody>
                           {ficha.agentesBiologicos.filter(a => a.descricao).map((agente, i) => (
                               <tr key={i}>
                                   <td className="border p-1">{agente.descricao}</td>
                                   <td className="border p-1">{agente.agenteProvavel}</td>
                                   <td className="border p-1 text-center">{agente.enquadramento ? 'Sim' : 'Não'}</td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
        
        <div className="mb-4 p-4 border rounded-lg no-break">
            <h3 className="font-bold mb-2 text-lg">4. MEDIDAS DE CONTROLE EXISTENTES</h3>
            <p className="text-sm"><span className="font-medium">EPCs Eficazes:</span> <span className="capitalize">{ficha.epcsEficaz}</span></p>
            <p className="text-sm"><span className="font-medium">EPIs Eficazes:</span> <span className="capitalize">{ficha.episEficaz}</span></p>
        </div>

        {ficha.observacoes && (
             <div className="mb-4 p-4 border rounded-lg no-break">
                <h3 className="font-bold mb-2 text-lg">5. OBSERVAÇÕES</h3>
                <p className="text-sm whitespace-pre-wrap">{ficha.observacoes}</p>
            </div>
        )}

        <div className="p-4 border rounded-lg no-break">
            <h3 className="font-bold mb-8 text-lg">6. ASSINATURAS</h3>
             <div className="grid grid-cols-2 gap-8 pt-12">
                <AssinaturaPrint label="Técnico/Engenheiro Responsável" nome={ficha.responsavelVistoria} />
                <AssinaturaPrint assinatura={ficha.assinaturaResponsavelArea} label="Responsável da Empresa" nome={ficha.acompanhante} />
            </div>
        </div>
    </section>
);


export const PrintableServiceCard = React.forwardRef<HTMLDivElement, PrintableServiceCardProps>(
  ({ service }, ref) => {
    const sortedFichasVisita = service.fichasVisita 
      ? [...service.fichasVisita].sort((a, b) => (a.dataPreenchimento?.seconds ?? 0) - (b.dataPreenchimento?.seconds ?? 0)) 
      : [];

    const sortedFichasPgr = service.fichasPGR
      ? [...service.fichasPGR].sort((a, b) => (a.dataPreenchimento?.seconds ?? 0) - (b.dataPreenchimento?.seconds ?? 0))
      : [];
      
    const sortedFichasLtcat = service.fichasLTCAT
        ? [...service.fichasLTCAT].sort((a, b) => (a.dataPreenchimento?.seconds ?? 0) - (b.dataPreenchimento?.seconds ?? 0))
        : [];
      
    const hasAnyFicha = sortedFichasVisita.length > 0 || sortedFichasPgr.length > 0 || sortedFichasLtcat.length > 0;

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
          <h1 className="text-3xl font-bold text-gray-900">Dossiê de Serviço</h1>
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
        
        <Separator className="my-8" />

        {!hasAnyFicha && (
            <div className="text-center text-gray-500">
                <p>Nenhuma ficha (Visita, PGR, LTCAT) foi encontrada para este serviço.</p>
            </div>
        )}

        {sortedFichasVisita.map((ficha, index) => (
          <React.Fragment key={`visita-${index}`}>
            <div className={index > 0 ? "page-break" : ""}></div>
             <FichaVisitaPrint ficha={ficha} />
          </React.Fragment>
        ))}

        {sortedFichasPgr.map((ficha, index) => (
            <React.Fragment key={`pgr-${index}`}>
                <div className={sortedFichasVisita.length > 0 || index > 0 ? "page-break" : ""}></div>
                <FichaPgrPrint ficha={ficha} />
            </React.Fragment>
        ))}

        {sortedFichasLtcat.map((ficha, index) => (
            <React.Fragment key={`ltcat-${index}`}>
                <div className={(sortedFichasVisita.length > 0 || sortedFichasPgr.length > 0) || index > 0 ? "page-break" : ""}></div>
                <FichaLtcatPrint ficha={ficha} service={service} />
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
