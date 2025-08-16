
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Service } from '../engenharia/page';
import { TecnicaTable } from '@/components/tecnica-table';
import { useServiceNotification } from '@/context/service-notification-context';

export default function TecnicaPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { resetTecnicaCount } = useServiceNotification();
  
  useEffect(() => {
    resetTecnicaCount();
  }, [resetTecnicaCount]);
  
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'servicos'), where('status', 'in', ['aguardando_visita', 'em_visita', 'concluido']));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const servicesData: Service[] = [];
      querySnapshot.forEach((doc) => {
        servicesData.push({ id: doc.id, ...doc.data() } as Service);
      });
      setServices(servicesData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching services for tecnica:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Técnica</h1>
        </div>
        {loading ? (
          <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <TecnicaTable services={services} />
        )}
      </div>
    </>
  );
}
