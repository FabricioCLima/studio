
'use client';

import type { Service } from "@/app/(main)/engenharia/page";
import { Badge } from "./ui/badge";
import { differenceInDays, isBefore, startOfDay } from "date-fns";

interface StatusBadgeProps {
    service: Service;
}

const statusConfig: { 
    [key: string]: { 
        label: string; 
        variant: "default" | "secondary" | "destructive" | "outline" | "success" | "info" | "warning" | "finalizado" | "digitacao" | "medicina" | "arquivado" | "vencendo" | "vencido"
    } 
} = {
    engenharia: { label: "Aguardando Agendamento", variant: "default" },
    agendado: { label: "Agendado", variant: "success" },
    aguardando_visita: { label: "Aguardando Visita", variant: "info" },
    em_visita: { label: "Em Visita", variant: "warning" },
    digitacao: { label: "Digitação", variant: "digitacao" },
    medicina: { label: "Medicina", variant: "medicina" },
    concluido: { label: "Concluído", variant: "finalizado" },
    atrasado: { label: "Atrasado", variant: "destructive" },
    arquivado: { label: "Arquivado", variant: "arquivado" },
    vencendo: { label: "Vencendo", variant: "vencendo"},
    vencido: { label: "Vencido", variant: "vencido" },
};


export function StatusBadge({ service }: StatusBadgeProps) {
    let currentStatus = service.status;
    
    const isVisitOverdue = (
        (service.status === 'agendado' || service.status === 'aguardando_visita') &&
        service.dataAgendamento &&
        isBefore(new Date(service.dataAgendamento.seconds * 1000), startOfDay(new Date()))
    );
    
    if (isVisitOverdue) {
        currentStatus = 'atrasado';
    } else if (
        service.dataServico &&
        !['concluido', 'arquivado'].includes(service.status)
    ) {
        const today = startOfDay(new Date());
        const registrationDate = startOfDay(new Date(service.dataServico.seconds * 1000));
        const daysSinceRegistration = differenceInDays(today, registrationDate);

        if (daysSinceRegistration > 365) {
            currentStatus = 'vencido';
        } else if (daysSinceRegistration > 335) { // 365 - 30 days
            currentStatus = 'vencendo';
        }
    }
    
    const config = statusConfig[currentStatus] || { label: service.status, variant: "secondary" };

    return (
        <Badge variant={config.variant}>
            {config.label}
        </Badge>
    );
}
