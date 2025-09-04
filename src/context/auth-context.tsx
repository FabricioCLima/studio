
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
      setLoading(true); // Inicia o carregamento sempre que o estado do usuário muda
      setUser(user);
      
      if (user?.email) {
          try {
            const userDocRef = doc(db, 'usuarios', user.email);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const userPermissions = userData.permissões || [];
                if (userPermissions.includes('admin')) {
                  setPermissions([
                      'admin', 'dashboard', 'cadastro', 'engenharia', 'tecnica', 
                      'digitacao', 'medicina', 'financeiro', 'tecnicos', 'vencidos', 
                      'arquivo-morto'
                  ]);
                } else {
                  setPermissions(userPermissions);
                }
            } else {
                setPermissions([]); // Usuário existe no Auth mas não no Firestore
            }
          } catch(error) {
              console.error("Erro ao buscar permissões do usuário:", error);
              setPermissions([]);
          }
      } else {
          setPermissions([]); // Nenhum usuário logado
      }
      
      setLoading(false); // Finaliza o carregamento após buscar as permissões
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
