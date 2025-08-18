
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import type { Service } from "./engenharia/page";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const statusTranslations: { [key: string]: string } = {
    engenharia: "Engenharia",
    agendado: "Agendado",
    aguardando_visita: "Aguardando Visita",
    em_visita: "Em Visita",
    digitacao: "Digitação",
    medicina: "Medicina",
    concluido: "Concluído",
};


export default function DashboardPage() {
    const { user } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'servicos'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const servicesData: Service[] = [];
            querySnapshot.forEach((doc) => {
                servicesData.push({ id: doc.id, ...doc.data() } as Service);
            });
            setServices(servicesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching services for dashboard:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const chartData = Object.entries(
        services.reduce((acc, service) => {
            const status = statusTranslations[service.status] || service.status;
            if (!acc[status]) {
                acc[status] = 0;
            }
            acc[status]++;
            return acc;
        }, {} as { [key: string]: number })
    ).map(([name, total]) => ({ name, total }));

  return (
    <>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total de Serviços Ativos
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                            >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                           <div className="text-2xl font-bold">{services.length}</div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Total de serviços em todos os setores
                        </p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Visão Geral dos Serviços</CardTitle>
                    <CardDescription>
                        Contagem de serviços em cada etapa do fluxo de trabalho.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? (
                        <div className="h-[350px] w-full">
                           <Skeleton className="h-full w-full" />
                        </div>
                     ) : chartData.length > 0 ? (
                        <ChartContainer config={{}} className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                     ) : (
                        <div className="flex h-[350px] w-full items-center justify-center">
                            <p className="text-muted-foreground">Nenhum dado para exibir no gráfico.</p>
                        </div>
                     )}
                </CardContent>
            </Card>

        </div>
    </>
  );
}
