'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';

type ServiceNotificationContextType = {
  engineeringCount: number;
};

const ServiceNotificationContext = createContext<ServiceNotificationContextType>({
  engineeringCount: 0,
});

export function ServiceNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [engineeringCount, setEngineeringCount] = useState(0);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'servicos'), where('status', '==', 'engenharia'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setEngineeringCount(querySnapshot.size);
      }, (error) => {
        console.error("Error fetching notification count:", error);
        setEngineeringCount(0);
      });
      return () => unsubscribe();
    } else {
        setEngineeringCount(0);
    }
  }, [user]);

  return (
    <ServiceNotificationContext.Provider value={{ engineeringCount }}>
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
