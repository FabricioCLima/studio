
'use client';

import { EngenhariaTable } from '@/components/engenharia-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

// Tipos para LTCAT
export type AgenteFisico = {
    agente: string;
    fonteGeradora: string;
    instrumento: string;
    numeroSerie: string;
    resultado: string;
    limiteTolerancia: string;
    metodologia: string;
    conclusao: string;
};

export type AgenteQuimico = {
    agente: string;
    fonteGeradora: string;
    tipoAmostra: string;
    tempoColeta: string;
    resultado: string;
    limiteTolerancia: string;
    metodologia: string;
    conclusao: string;
};

export type AgenteBiologico = {
    descricao: string;
    agenteProvavel: string;
    enquadramento: boolean;
};

// Tipos para PGR
export type PgrAcaoCorretiva = {
    descricaoNaoConformidade: string;
    registroFotografico?: string;
    nivelRisco: 'baixo' | 'medio' | 'alto' | 'critico';
    acaoCorretiva: string;
    responsavel: string;
    prazo: Date;
};

// Tipos para a nova Ficha de Visita Detalhada
export type ChecklistItem = {
  status: 'c' | 'nc' | 'na';
  observacoes: string;
  evidencia?: string; // para upload de foto/doc
};

export type NaoConformidadeDetalhada = {
  id: string; // Gerado automaticamente
  descricao: string;
  riscoAssociado: 'baixo' | 'medio' | 'alto';
  normaRegulamentadora: string;
  recomendacao: string;
  prazo: Date;
  responsavel: string;
};

export type Assinatura = {
    nome: string;
    data: { seconds: number; nanoseconds: number; } | Date;
}

// Tipo FichaVisita Unificado
export type FichaVisita = {
  // Seção 1: Identificação
  id: string; // Gerado automaticamente
  dataVisita: { seconds: number; nanoseconds: number; };
  horaInicio: string;
  horaTermino: string;
  tecnicoResponsavel: string;
  tipoVisita: 'rotina' | 'investigacao' | 'auditoria' | 'fiscalizacao' | 'outro';
  objetivoVisita: string;

  // Seção 2: Dados da Empresa
  setorInspecionado: string;
  responsavelEmpresa: string;
  cargoResponsavel: string;
  contatoResponsavel: string;

  // Seção 3: Checklist de Conformidade
  checklist: { [key: string]: ChecklistItem };

  // Seção 4: Registro de Não Conformidades
  naoConformidades: NaoConformidadeDetalhada[];
  
  // Seção 5: Observações Gerais
  pontosPositivos: string;
  outrasObservacoes: string;
  parecerTecnico: string;

  // Seção 6: Finalização
  assinaturaTecnico?: Assinatura | null;
  assinaturaResponsavel?: Assinatura | null;
  localData: string;
  
  dataPreenchimento: { seconds: number; nanoseconds: number; }; // Mantido para ordenação

  // Seções Opcionais
  pgr?: {
    preencher: boolean; // Usado apenas no form
    numeroVistoria: string;
    atividade: string;
    responsavelVistoria: string;
    acompanhantes?: string;
    checklistPGR: { [key: string]: { status: 'c' | 'nc' | 'na' }; };
    planoAcao?: PgrAcaoCorretiva[];
    assinaturaResponsavelArea?: Assinatura | null;
  };
  
  ltcat?: {
    preencher: boolean; // Usado apenas no form
    cnae: string;
    responsavelVistoria: string;
    setor: string;
    ghe: string;
    funcoes: string;
    totalTrabalhadores: number;
    homens: number;
    mulheres: number;
    descricaoAtividades: string;
    jornadaTrabalho: string;
    frequenciaExposicao: 'continua' | 'intermitente';
    arranjoFisico: string;
    equipamentos: string;
    agentesFisicos?: AgenteFisico[];
    agentesQuimicos?: AgenteQuimico[];
    agentesBiologicos?: AgenteBiologico[];
    epcs: string[];
    epcsOutros: string;
    epcsEficaz: 'sim' | 'nao' | 'parcialmente';
    epis: string[];
    episOutros: string;
    episEficaz: 'sim' | 'nao' | 'na';
    observacoes: string;
    fotos: string[];
    assinaturaResponsavelArea?: Assinatura | null;
  };
};

export type Service = {
  id: string;
  cnpj: string;
  nomeEmpresa: string;
  cep: string;
  cidade: string;
  endereco: string;
  bairro: string;
  complemento?: string;
  telefone: string;
  contato: string;
  email?: string;
  servicos: { nome: string; valor?: number }[];
  dataServico: {
    seconds: number;
    nanoseconds: number;
  };
  dataVencimento: {
    seconds: number;
    nanoseconds: number;
  };
  status: string;
  dataAgendamento?: {
    seconds: number;
    nanoseconds: number;
  } | null;
  tecnico?: string;
  anexos?: { name: string; type: string; data: string }[];
  digitador?: string;
  responsavel?: string;
  medicinaResponsavel?: string;
  fichasVisita?: FichaVisita[];
};

export default function EngenhariaPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'servicos'), where('status', 'in', ['engenharia', 'agendado', 'aguardando_visita', 'em_visita', 'digitacao', 'medicina', 'financeiro', 'concluido', 'avaliacao']));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const servicesData: Service[] = [];
      querySnapshot.forEach((doc) => {
        servicesData.push({ id: doc.id, ...doc.data() } as Service);
      });
      setServices(servicesData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching services:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Engenharia</h1>
        </div>
        {loading ? (
          <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <EngenhariaTable services={services} />
        )}
      </div>
    </>
  );
}
