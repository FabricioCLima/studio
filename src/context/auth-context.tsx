'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserPermissions, type Permission } from '@/lib/permissions';

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user?.email) {
          const userPermissions = getUserPermissions(user.email);
          setPermissions(userPermissions);
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
