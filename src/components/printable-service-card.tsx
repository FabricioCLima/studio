
'use client';

import type { Service } from '@/app/(main)/engenharia/page';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';

interface PrintableServiceCardProps {
  service: Service;
}

export const PrintableServiceCard = React.forwardRef<HTMLDivElement, PrintableServiceCardProps>(
  ({ service }, ref) => {
    return (
      <div ref={ref} className="p-8 font-sans text-gray-800">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900">Ficha de Ordem de Serviço</h1>
          <p className="text-sm text-gray-600">Service Flow Dashboard</p>
        </header>

        <section className="mb-6">
          <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Dados da Empresa</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Nome da Empresa</p>
              <p className="font-semibold">{service.nomeEmpresa}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">CNPJ</p>
              <p>{service.cnpj}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Contato</p>
              <p>{service.contato}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Telefone</p>
              <p>{service.telefone}</p>
            </div>
             <div>
              <p className="text-sm font-medium text-gray-600">Email</p>
              <p>{service.email || 'Não informado'}</p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Endereço</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">CEP</p>
              <p>{service.cep}</p>
            </div>
             <div>
              <p className="text-sm font-medium text-gray-600">Cidade</p>
              <p>{service.cidade}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Endereço</p>
              <p>{service.endereco}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Bairro</p>
              <p>{service.bairro}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Complemento</p>
              <p>{service.complemento || 'Não informado'}</p>
            </div>
          </div>
        </section>
        
        <section className="mb-6">
          <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">Detalhes do Serviço</h2>
           <div className="grid grid-cols-2 gap-x-8 gap-y-3">
             <div>
                <p className="text-sm font-medium text-gray-600">Data de Cadastro</p>
                <p>{service.dataServico ? format(new Date(service.dataServico.seconds * 1000), 'PPP', { locale: ptBR }) : '-'}</p>
             </div>
             <div>
                <p className="text-sm font-medium text-gray-600">Data de Agendamento</p>
                <p>{service.dataAgendamento ? format(new Date(service.dataAgendamento.seconds * 1000), 'PPP', { locale: ptBR }) : 'Não agendado'}</p>
             </div>
             <div>
                <p className="text-sm font-medium text-gray-600">Técnico Responsável</p>
                <p>{service.tecnico || 'Não atribuído'}</p>
             </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Status Atual</p>
                <p className="font-semibold">{service.status}</p>
             </div>
             <div className="col-span-2">
                <p className="text-sm font-medium text-gray-600">Serviços Solicitados</p>
                {service.servicos && service.servicos.length > 0 ? (
                    <ul className="list-disc list-inside">
                        {service.servicos.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                ) : (
                    <p>Nenhum serviço especificado.</p>
                )}
             </div>
           </div>
        </section>

        <footer className="mt-12 pt-4 text-center text-xs text-gray-500">
            <p>Documento gerado por Service Flow Dashboard em {format(new Date(), "'em' dd/MM/yyyy 'às' HH:mm")}</p>
        </footer>
      </div>
    );
  }
);

PrintableServiceCard.displayName = 'PrintableServiceCard';
