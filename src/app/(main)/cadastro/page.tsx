'use client';

import { CadastroDialog } from '@/components/cadastro-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Service } from './engenharia/page';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CadastroTable } from '@/components/cadastro-table';

export default function CadastroPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'servicos'));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const servicesData: Service[] = [];
        querySnapshot.forEach((doc) => {
          servicesData.push({ id: doc.id, ...doc.data() } as Service);
        });
        setAllServices(servicesData);
        setFilteredServices(servicesData); 
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching services:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    const results = allServices.filter(
      (service) =>
        service.nomeEmpresa.toLowerCase().includes(lowercasedTerm) ||
        service.cnpj.toLowerCase().includes(lowercasedTerm) ||
        service.servicos.some((s) => s.toLowerCase().includes(lowercasedTerm))
    );
    setFilteredServices(results);
  }, [searchTerm, allServices]);

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Cadastro de Serviço
          </h1>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Cadastrar Serviço
          </Button>
        </div>
        <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Buscar por CNPJ, nome da empresa ou serviço..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
        ) : (
            <CadastroTable services={filteredServices} />
        )}
      </div>
      <CadastroDialog open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
