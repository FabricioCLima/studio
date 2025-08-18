
'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import { usePathname } from 'next/navigation';

type ServiceNotificationContextType = {
  engineeringCount: number;
  tecnicaCount: number;
  digitacaoCount: number;
  medicinaCount: number;
  resetTecnicaCount: () => void;
  resetDigitacaoCount: () => void;
  resetMedicinaCount: () => void;
};

const ServiceNotificationContext = createContext<ServiceNotificationContextType>({
  engineeringCount: 0,
  tecnicaCount: 0,
  digitacaoCount: 0,
  medicinaCount: 0,
  resetTecnicaCount: () => {},
  resetDigitacaoCount: () => {},
  resetMedicinaCount: () => {},
});

export function ServiceNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [engineeringCount, setEngineeringCount] = useState(0);
  const [tecnicaCount, setTecnicaCount] = useState(0);
  const [digitacaoCount, setDigitacaoCount] = useState(0);
  const [medicinaCount, setMedicinaCount] = useState(0);
  
  useEffect(() => {
    if (user) {
      const engQ = query(collection(db, 'servicos'), where('status', '==', 'engenharia'));
      const engUnsubscribe = onSnapshot(engQ, (snapshot) => {
        setEngineeringCount(snapshot.size);
      }, (error) => {
        console.error("Error fetching engineering count:", error);
      });

      const tecQ = query(collection(db, 'servicos'), where('status', '==', 'aguardando_visita'));
      const tecUnsubscribe = onSnapshot(tecQ, (snapshot) => {
        if (pathname !== '/tecnica') {
            setTecnicaCount(snapshot.size);
        }
      }, (error) => {
        console.error("Error fetching tecnica count:", error);
      });

      const digQ = query(collection(db, 'servicos'), where('status', '==', 'digitacao'));
      const digUnsubscribe = onSnapshot(digQ, (snapshot) => {
        if (pathname !== '/digitacao') {
            setDigitacaoCount(snapshot.size);
        }
      }, (error) => {
        console.error("Error fetching digitacao count:", error);
      });
      
      const medQ = query(collection(db, 'servicos'), where('status', '==', 'medicina'));
      const medUnsubscribe = onSnapshot(medQ, (snapshot) => {
        if (pathname !== '/medicina') {
            setMedicinaCount(snapshot.size);
        }
      }, (error) => {
        console.error("Error fetching medicina count:", error);
      });


      return () => {
        engUnsubscribe();
        tecUnsubscribe();
        digUnsubscribe();
        medUnsubscribe();
      };
    } else {
        setEngineeringCount(0);
        setTecnicaCount(0);
        setDigitacaoCount(0);
        setMedicinaCount(0);
    }
  }, [user, pathname]);
  
  const resetTecnicaCount = useCallback(() => {
      if (pathname === '/tecnica') {
        setTecnicaCount(0);
      }
  }, [pathname]);

  const resetDigitacaoCount = useCallback(() => {
    if (pathname === '/digitacao') {
      setDigitacaoCount(0);
    }
  }, [pathname]);
  
  const resetMedicinaCount = useCallback(() => {
    if (pathname === '/medicina') {
      setMedicinaCount(0);
    }
  }, [pathname]);

  const value = {
      engineeringCount,
      tecnicaCount,
      digitacaoCount,
      medicinaCount,
      resetTecnicaCount,
      resetDigitacaoCount,
      resetMedicinaCount,
  }

  return (
    <ServiceNotificationContext.Provider value={value}>
      {children}
    </ServiceNotificationContext.Provider>
  );
}

export const useServiceNotification = () => {
  const context = useContext(ServiceNotificationContext);
  if (context === undefined) {
    throw new Error('useServiceNotification must be used within a ServiceNotificationProvider');
  }
  return context;
};
