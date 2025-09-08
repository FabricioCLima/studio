
'use client';

import { FinanceiroTable } from '@/components/financeiro-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useServiceNotification } from '@/context/service-notification-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Service } from '../engenharia/page';

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

    // Now fetches all services that are not concluded or archived
    const activeStatuses = ['engenharia', 'agendado', 'aguardando_visita', 'em_visita', 'digitacao', 'medicina', 'financeiro', 'avaliacao'];
    const q = query(collection(db, 'servicos'), where('status', 'in', activeStatuses));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const servicesData: Service[] = [];
      querySnapshot.forEach((doc) => {
        servicesData.push({ id: doc.id, ...doc.data() } as Service);
      });
      setServices(servicesData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching services for financeiro:", error);
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
