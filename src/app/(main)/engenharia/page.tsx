
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
  servicos: string[];
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
  valorServico?: number;
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
