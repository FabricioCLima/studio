import { CadastroForm } from '@/components/cadastro-form';

export default function CadastroPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cadastro de Serviço</h1>
      </div>
      <CadastroForm />
    </div>
  );
}
