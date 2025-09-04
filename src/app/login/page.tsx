
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, permissions, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Se o usuário já está logado e tem permissões, redirecione para o dashboard.
    // Isso evita que um usuário logado veja a tela de login novamente.
    if (!authLoading && user) {
        if (permissions.length > 0 || permissions.includes('admin')) {
             router.push('/');
        }
    }
  }, [user, permissions, authLoading, router]);
  
  if (authLoading || (user && (permissions.length > 0 || permissions.includes('admin')))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">
                <Skeleton className="h-8 w-24" />
            </CardTitle>
            <CardDescription>
                <Skeleton className="h-4 w-full" />
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid gap-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // A navegação agora será tratada pelo useEffect e pelo AuthProvider
      // que detecta a mudança no estado de autenticação.
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro de Login',
        description: 'Verifique suas credenciais ou se você tem permissão para acessar.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Entre com seu e-mail e senha para acessar o painel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : <> <LogIn className="mr-2 h-4 w-4" /> Entrar </>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
