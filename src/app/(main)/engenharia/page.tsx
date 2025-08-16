'use client';

import { CadastroDialog } from '@/components/cadastro-dialog';
import { EngenhariaTable } from '@/components/engenharia-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  servicos: string[];
  dataServico: {
    seconds: number;
    nanoseconds: number;
  };
  status: string;
};

export default function EngenhariaPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'servicos'), where('status', '==', 'engenharia'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const servicesData: Service[] = [];
      querySnapshot.forEach((doc) => {
        servicesData.push({ id: doc.id, ...doc.data() } as Service);
      });
      setServices(servicesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Fila de Engenharia</h1>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Cadastrar Serviço
          </Button>
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
      <CadastroDialog open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
