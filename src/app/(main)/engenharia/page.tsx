
'use client';

import { EngenhariaTable } from '@/components/engenharia-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export type NaoConformidade = {
  descricao: string;
  riscoAssociado: string;
  recomendacao: string;
  prazo: Date;
  responsavelAcao: string;
};

export type ItemVerificacao = {
  status: 'c' | 'nc' | 'na';
  observacoes: string;
};

export type Assinatura = {
    nome: string;
    data: { seconds: number; nanoseconds: number; } | Date;
}

export type FichaVisita = {
  setorInspecionado: string;
  dataVistoria: {
    seconds: number;
    nanoseconds: number;
  };
  horario: string;
  acompanhante: string;
  tipoInspecao: 'rotina' | 'denuncia' | 'especifica' | 'oficial';
  itensVerificacao: {
    [key: string]: ItemVerificacao;
  };
  naoConformidades: NaoConformidade[];
  dataPreenchimento: {
    seconds: number;
    nanoseconds: number;
  };
  tecnico?: string;
  assinaturaResponsavelArea?: Assinatura | null;
};

export type PgrAcaoCorretiva = {
    descricaoNaoConformidade: string;
    registroFotografico?: string;
    nivelRisco: 'baixo' | 'medio' | 'alto' | 'critico';
    acaoCorretiva: string;
    responsavel: string;
    prazo: Date;
};

export type FichaPGR = {
    numeroVistoria: string;
    dataVistoria: { seconds: number; nanoseconds: number };
    horario: string;
    setor: string;
    atividade: string;
    responsavelVistoria: string;
    acompanhantes: string;
    checklist: {
        [key: string]: { status: 'c' | 'nc' | 'na' };
    };
    planoAcao: PgrAcaoCorretiva[];
    dataPreenchimento: { seconds: number; nanoseconds: number };
    assinaturaResponsavelArea?: Assinatura | null;
};

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

export type FichaLTCAT = {
    cnae: string;
    dataVistoria: { seconds: number; nanoseconds: number };
    horario: string;
    responsavelVistoria: string;
    acompanhante: string;
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
    dataPreenchimento: { seconds: number; nanoseconds: number };
    assinaturaResponsavelArea?: Assinatura | null;
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
  fichasPGR?: FichaPGR[];
  fichasLTCAT?: FichaLTCAT[];
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
