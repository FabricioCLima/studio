
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setUser(user);

      if (user && user.email) {
        try {
          const userDocRef = doc(db, 'usuarios', user.email);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            const userPermissions = data.permissões || [];
            
            if (userPermissions.includes('admin')) {
              setPermissions(['admin', ...ALL_PERMISSIONS]);
            } else {
              setPermissions(userPermissions);
            }
          } else {
            console.warn(`Usuário ${user.email} não encontrado no Firestore. Sem permissões atribuídas.`);
            setPermissions([]);
          }
        } catch (error) {
          console.error("Erro ao buscar permissões do usuário:", error);
          setPermissions([]);
        }
      } else {
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
