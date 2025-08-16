'use client';

import { CadastroDialog } from '@/components/cadastro-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';

export default function CadastroPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Cadastro de Serviço
          </h1>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Cadastrar Serviço
          </Button>
        </div>
        <p>Clique no botão acima para adicionar um novo serviço.</p>
      </div>
      <CadastroDialog open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
