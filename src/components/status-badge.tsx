
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
        variant: "default" | "secondary" | "destructive" | "outline" | "success" | "info" | "warning" | "finalizado" | "digitacao" | "medicina" | "arquivado"
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
