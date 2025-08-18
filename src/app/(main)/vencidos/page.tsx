
'use client';

import type { Service } from '@/app/(main)/engenharia/page';
import { VencidosTable } from '@/components/vencidos-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { differenceInDays, startOfDay } from 'date-fns';

export default function VencidosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const activeStatuses = ['engenharia', 'agendado', 'aguardando_visita', 'em_visita', 'digitacao', 'medicina'];
    
    const q = query(
        collection(db, 'servicos'), 
        where('status', 'in', activeStatuses)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const servicesData: Service[] = [];
      const today = startOfDay(new Date());

      querySnapshot.forEach((doc) => {
        const service = { id: doc.id, ...doc.data() } as Service;
        
        if (service.dataServico) {
            const registrationDate = startOfDay(new Date(service.dataServico.seconds * 1000));
            const daysSinceRegistration = differenceInDays(today, registrationDate);
            
            if (daysSinceRegistration > 365) {
                servicesData.push(service);
            }
        }
      });
      setServices(servicesData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching expired services:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Serviços Vencidos</h1>
        </div>
        {loading ? (
          <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <VencidosTable services={services} />
        )}
      </div>
    </>
  );
}
