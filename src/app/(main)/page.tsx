'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
    const { user } = useAuth();

  return (
    <>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Bem-vindo(a) de volta, {user?.displayName || user?.email}!</CardTitle>
                    <CardDescription>
                    Este é o seu painel de controle para gerenciamento de serviços.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Utilize o menu lateral para navegar entre as seções, cadastrar novos serviços e acompanhar o fluxo de trabalho.</p>
                </CardContent>
            </Card>
        </div>
    </>
  );
}
