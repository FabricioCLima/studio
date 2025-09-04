
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { usePathname } from 'next/navigation';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export type Permission = 
    | 'admin'
    | 'dashboard'
    | 'cadastro'
    | 'engenharia'
    | 'tecnica'
    | 'digitacao'
    | 'medicina'
    | 'financeiro'
    | 'tecnicos'
    | 'vencidos'
    | 'arquivo-morto';

const ALL_PERMISSIONS: Permission[] = [
    'dashboard', 'cadastro', 'engenharia', 'tecnica', 'digitacao', 'medicina', 
    'financeiro', 'tecnicos', 'vencidos', 'arquivo-morto'
];

type AuthContextType = {
  user: User | null;
  loading: boolean;
  permissions: Permission[];
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  permissions: [],
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      
      if (currentUser && currentUser.email) {
        setUser(currentUser);
        
        try {
          const userDocRef = doc(db, 'usuarios', currentUser.email);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userPermissions = userData.permissões || [];
            
            if (userPermissions.includes('admin')) {
              setPermissions(['admin', ...ALL_PERMISSIONS]);
            } else {
              setPermissions(userPermissions);
            }
          } else {
            setPermissions([]);
          }
        } catch (error) {
          console.error("Error fetching user permissions:", error);
          setPermissions([]);
        }
      } else {
        setUser(null);
        setPermissions([]);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading, permissions };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type ServiceNotificationContextType = {
  engineeringCount: number;
  tecnicaCount: number;
  digitacaoCount: number;
  medicinaCount: number;
  financeiroCount: number;
  resetTecnicaCount: () => void;
  resetDigitacaoCount: () => void;
  resetMedicinaCount: () => void;
  resetFinanceiroCount: () => void;
};

const ServiceNotificationContext = createContext<ServiceNotificationContextType>({
  engineeringCount: 0,
  tecnicaCount: 0,
  digitacaoCount: 0,
  medicinaCount: 0,
  financeiroCount: 0,
  resetTecnicaCount: () => {},
  resetDigitacaoCount: () => {},
  resetMedicinaCount: () => {},
  resetFinanceiroCount: () => {},
});

export function ServiceNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [engineeringCount, setEngineeringCount] = useState(0);
  const [tecnicaCount, setTecnicaCount] = useState(0);
  const [digitacaoCount, setDigitacaoCount] = useState(0);
  const [medicinaCount, setMedicinaCount] = useState(0);
  const [financeiroCount, setFinanceiroCount] = useState(0);
  
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

      const finQ = query(collection(db, 'servicos'), where('status', '==', 'financeiro'));
      const finUnsubscribe = onSnapshot(finQ, (snapshot) => {
        if (pathname !== '/financeiro') {
            setFinanceiroCount(snapshot.size);
        }
      }, (error) => {
        console.error("Error fetching financeiro count:", error);
      });


      return () => {
        engUnsubscribe();
        tecUnsubscribe();
        digUnsubscribe();
        medUnsubscribe();
        finUnsubscribe();
      };
    } else {
        setEngineeringCount(0);
        setTecnicaCount(0);
        setDigitacaoCount(0);
        setMedicinaCount(0);
        setFinanceiroCount(0);
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

  const resetFinanceiroCount = useCallback(() => {
    if (pathname === '/financeiro') {
      setFinanceiroCount(0);
    }
  }, [pathname]);

  const value = {
      engineeringCount,
      tecnicaCount,
      digitacaoCount,
      medicinaCount,
      financeiroCount,
      resetTecnicaCount,
      resetDigitacaoCount,
      resetMedicinaCount,
      resetFinanceiroCount,
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
