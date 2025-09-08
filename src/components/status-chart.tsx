
'use client';

import type { Service } from "@/app/(main)/engenharia/page";
import { useTheme } from "next-themes";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface StatusChartProps {
    services: Service[];
}

const statusLabels: { [key: string]: string } = {
    engenharia: "Engenharia",
    agendado: "Agendado",
    aguardando_visita: "Aguardando Visita",
    em_visita: "Em Visita",
    digitacao: "Digitação",
    medicina: "Medicina",
    financeiro: "Financeiro",
    concluido: "Concluído",
    avaliacao: "Avaliação",
};

const statusOrder = [
    'engenharia',
    'agendado',
    'aguardando_visita',
    'em_visita',
    'avaliacao',
    'digitacao',
    'medicina',
    'financeiro',
    'concluido',
];

export function StatusChart({ services }: StatusChartProps) {
    const { theme } = useTheme();

    const statusCounts = services.reduce((acc, service) => {
        const status = service.status;
        if (statusLabels[status]) {
            acc[status] = (acc[status] || 0) + 1;
        }
        return acc;
    }, {} as { [key: string]: number });

    const chartData = statusOrder
        .map(status => ({
            name: statusLabels[status],
            total: statusCounts[status] || 0,
        }))
        .filter(item => item.total > 0);

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                />
                <Tooltip
                     contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem'
                    }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
