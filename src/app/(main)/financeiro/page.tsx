
'use client';

import { FinanceiroTable } from '@/components/financeiro-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useServiceNotification } from '@/context/service-notification-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Service } from '../engenharia/page';

const exampleService: Service = {
  id: 'example-1',
  nomeEmpresa: 'Empresa Exemplo S.A.',
  cnpj: '12.345.678/0001-99',
  cep: '12345-678',
  cidade: 'Cidade Exemplo',
  endereco: 'Rua Exemplo, 123',
  bairro: 'Bairro Exemplo',
  telefone: '(11) 98765-4321',
  contato: 'João Exemplo',
  email: 'contato@exemplo.com',
  servicos: [
    { nome: 'PGR - Programa de Gerenciamento de Riscos', valor: 1200 },
    { nome: 'PCMSO - Prog. de Contr. Médico de Saúde Ocupacional', valor: 800 },
  ],
  dataServico: { seconds: Math.floor(new Date().getTime() / 1000) - 86400 * 15, nanoseconds: 0 },
  dataVencimento: { seconds: Math.floor(new Date().getTime() / 1000) + 86400 * 350, nanoseconds: 0 },
  status: 'financeiro',
  medicinaResponsavel: 'Dr. Exemplo',
};

export default function FinanceiroPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { resetFinanceiroCount } = useServiceNotification();
  
  useEffect(() => {
    resetFinanceiroCount();
  }, [resetFinanceiroCount]);
  
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'servicos'), where('status', '==', 'financeiro'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const servicesData: Service[] = [exampleService];
      querySnapshot.forEach((doc) => {
        // Evita duplicar o exemplo se um com ID igual vier do banco
        if (doc.id !== exampleService.id) {
            servicesData.push({ id: doc.id, ...doc.data() } as Service);
        }
      });
      setServices(servicesData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching services for financeiro:", error);
        setServices([exampleService]); // Mostra o exemplo mesmo em caso de erro
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        </div>
        {loading ? (
          <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <FinanceiroTable services={services} />
        )}
      </div>
    </>
  );
}
