'use client';

import { CadastroDialog } from "@/components/cadastro-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { PlusCircle } from "lucide-react";
import { useState } from "react";

export default function DashboardPage() {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Cadastrar Serviço
                </Button>
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
        <CadastroDialog open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
