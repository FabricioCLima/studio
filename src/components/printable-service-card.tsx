
'use client';

import type { Service } from '@/app/(main)/engenharia/page';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';
import { Separator } from './ui/separator';

interface PrintableServiceCardProps {
  service: Service;
}

export const PrintableServiceCard = React.forwardRef<HTMLDivElement, PrintableServiceCardProps>(
  ({ service }, ref) => {

    return (
      <div ref={ref} className="p-4 sm:p-6 font-sans text-gray-800 bg-white">
        <style type="text/css" media="print">
          {`
            @page { size: auto;  margin: 20mm; }
            @media print {
              body { -webkit-print-color-adjust: exact; color-adjust: exact; }
              .no-break { page-break-inside: avoid; }
              .page-break { page-break-before: always; }
            }
          `}
        </style>
        <header className="mb-8 border-b pb-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Relatório de Serviço</h1>
          <p className="text-sm text-gray-600">Service Flow Dashboard</p>
        </header>

        <section className="mb-6 no-break">
          <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Dados da Empresa</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div><p className="font-medium text-gray-600">Nome da Empresa:</p><p className="font-semibold">{service.nomeEmpresa}</p></div>
            <div><p className="font-medium text-gray-600">CNPJ:</p><p>{service.cnpj}</p></div>
            <div><p className="font-medium text-gray-600">Contato:</p><p>{service.contato}</p></div>
            <div><p className="font-medium text-gray-600">Telefone:</p><p>{service.telefone}</p></div>
            <div className="col-span-2"><p className="font-medium text-gray-600">Endereço:</p><p>{`${service.endereco}, ${service.bairro}, ${service.cidade}`}</p></div>
          </div>
        </section>
        
        <Separator className="my-8" />
        
        <section className="mb-6 no-break">
           <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Detalhes do Serviço</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div><p className="font-medium text-gray-600">Data do Cadastro:</p><p>{service.dataServico ? format(new Date(service.dataServico.seconds * 1000), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</p></div>
                <div><p className="font-medium text-gray-600">Data de Vencimento:</p><p>{service.dataVencimento ? format(new Date(service.dataVencimento.seconds * 1000), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</p></div>
                <div><p className="font-medium text-gray-600">Status:</p><p>{service.status}</p></div>
                <div><p className="font-medium text-gray-600">Técnico Responsável:</p><p>{service.tecnico || '-'}</p></div>
                 <div className="col-span-2"><p className="font-medium text-gray-600">Serviços Contratados:</p>
                    <ul className="list-disc list-inside">
                        {service.servicos.map((s, i) => <li key={i}>{s.nome}</li>)}
                    </ul>
                </div>
            </div>
        </section>
        
        <footer className="mt-12 pt-4 border-t text-center text-xs text-gray-500 no-break">
            <p>Documento gerado por Service Flow Dashboard em {format(new Date(), "'em' dd/MM/yyyy 'às' HH:mm")}</p>
        </footer>
      </div>
    );
  }
);

PrintableServiceCard.displayName = 'PrintableServiceCard';
