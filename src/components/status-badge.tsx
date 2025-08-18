
'use client';

import type { Service } from "@/app/(main)/engenharia/page";
import { Badge } from "./ui/badge";
import { isBefore, startOfDay } from "date-fns";

interface StatusBadgeProps {
    service: Service;
}

const statusConfig: { 
    [key: string]: { 
        label: string; 
        variant: "default" | "secondary" | "destructive" | "outline" | "success" | "info" | "warning" | "finalizado" | "digitacao"
    } 
} = {
    engenharia: { label: "Aguardando Agendamento", variant: "default" },
    agendado: { label: "Agendado", variant: "success" },
    aguardando_visita: { label: "Aguardando Visita", variant: "info" },
    em_visita: { label: "Em Visita", variant: "warning" },
    digitacao: { label: "Digitação", variant: "digitacao" },
    concluido: { label: "Concluído", variant: "finalizado" },
    tecnica: { label: "Técnica", variant: "secondary" },
    medicina: { label: "Medicina", variant: "destructive" },
    atrasado: { label: "Atrasado", variant: "destructive" },
};


export function StatusBadge({ service }: StatusBadgeProps) {
    let currentStatus = service.status;
    
    const isOverdue = (
        (service.status === 'agendado' || service.status === 'aguardando_visita') &&
        service.dataAgendamento &&
        isBefore(new Date(service.dataAgendamento.seconds * 1000), startOfDay(new Date()))
    );

    if (isOverdue) {
        currentStatus = 'atrasado';
    }
    
    const config = statusConfig[currentStatus] || { label: service.status, variant: "secondary" };

    return (
        <Badge variant={config.variant}>
            {config.label}
        </Badge>
    );
}
