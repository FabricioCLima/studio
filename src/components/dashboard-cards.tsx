
'use client';

import type { Service } from "@/app/(main)/engenharia/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays, isAfter, startOfDay, subDays } from "date-fns";
import { Activity, CheckCircle, Clock, AlertTriangle, DollarSign } from "lucide-react";

interface DashboardCardsProps {
    services: Service[];
}

export function DashboardCards({ services }: DashboardCardsProps) {
    const today = startOfDay(new Date());

    const activeServices = services.filter(s => s.status !== 'arquivado');
    
    const concludedLast30Days = services.filter(s => 
        s.status === 'concluido' && 
        s.dataServico &&
        isAfter(new Date(s.dataServico.seconds * 1000), subDays(today, 30))
    );

    const revenueLast30Days = concludedLast30Days.reduce((acc, service) => {
        return acc + (service.valorServico || 0);
    }, 0);

    const pendingServices = services.filter(s => 
        !['concluido', 'arquivado'].includes(s.status)
    ).length;

    const expiredServices = services.filter(s => {
        if (s.dataServico && !['concluido', 'arquivado'].includes(s.status)) {
            const registrationDate = startOfDay(new Date(s.dataServico.seconds * 1000));
            return differenceInDays(today, registrationDate) > 365;
        }
        return false;
    }).length;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeServices.length}</div>
                    <p className="text-xs text-muted-foreground">Total de serviços não arquivados</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Concluídos (30 dias)</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{concludedLast30Days.length}</div>
                    <p className="text-xs text-muted-foreground">Serviços finalizados recentemente</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Faturamento (30 dias)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                         {revenueLast30Days.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <p className="text-xs text-muted-foreground">Receita de serviços concluídos</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pendingServices}</div>
                    <p className="text-xs text-muted-foreground">Serviços em andamento</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{expiredServices}</div>
                    <p className="text-xs text-muted-foreground">Serviços com mais de 365 dias</p>
                </CardContent>
            </Card>
        </div>
    )
}
