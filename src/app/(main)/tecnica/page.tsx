
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Service } from '../engenharia/page';
import { TecnicaTable } from '@/components/tecnica-table';
import { useServiceNotification } from '@/context/service-notification-context';
import { FichaVisitaView } from '@/components/ficha-visita-view';
import { PgrView } from '@/components/pgr-view';
import { LtcatView } from '@/components/ltcat-view';

type ViewMode = 'table' | 'ficha_visita' | 'pgr' | 'ltcat';

export default function TecnicaPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

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

    const q = query(collection(db, 'servicos'), where('status', 'in', ['aguardando_visita', 'em_visita']));
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

  const handleSelectService = (service: Service) => {
      setSelectedService(service);
      setViewMode('ficha_visita');
  }
  
  const handleSwitchView = (mode: ViewMode) => {
      setViewMode(mode);
  }

  const handleBackToTable = () => {
      setSelectedService(null);
      setViewMode('table');
  }

  if (loading) {
     return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Técnica</h1>
          </div>
          <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
     )
  }

  if (selectedService) {
    if (viewMode === 'ficha_visita') {
        return <FichaVisitaView 
                    serviceId={selectedService.id} 
                    onBack={handleBackToTable} 
                    onSwitchView={handleSwitchView}
                />;
    }
    if (viewMode === 'pgr') {
        return <PgrView 
                    serviceId={selectedService.id} 
                    onBack={() => handleSwitchView('ficha_visita')} 
                />;
    }
    if (viewMode === 'ltcat') {
        return <LtcatView 
                    serviceId={selectedService.id} 
                    onBack={() => handleSwitchView('ficha_visita')} 
                />;
    }
  }


  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Técnica</h1>
        </div>
        <TecnicaTable services={services} onSelectService={handleSelectService} />
      </div>
    </>
  );
}
