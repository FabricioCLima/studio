
export type Permission = 
    | 'admin'
    | 'dashboard'
    | 'cadastro'
    | 'engenharia'
    | 'tecnica'
    | 'digitacao'
    | 'medicina'
    | 'financeiro'
    | 'tecnicos'
    | 'vencidos'
    | 'arquivo-morto';

// Neste objeto você define as permissões para cada e-mail.
// A chave é o e-mail do usuário e o valor é um array com as permissões.
const permissions: { [email: string]: Permission[] } = {
    // --- Adicione aqui os e-mails e suas permissões ---

    // Exemplo de administrador (acesso a tudo)
    'admin@example.com': ['admin'],

    // Exemplo de um usuário com acesso a múltiplos setores
    'gerente@example.com': ['dashboard', 'engenharia', 'tecnica', 'digitacao', 'medicina', 'financeiro', 'vencidos', 'arquivo-morto'],

    // Exemplo de acessos por setor
    'engenharia@example.com': ['dashboard', 'engenharia', 'vencidos'],
    'tecnica@example.com': ['dashboard', 'tecnica'],
    'digitacao@example.com': ['dashboard', 'digitacao'],
    'medicina@example.com': ['dashboard', 'medicina'],
    'financeiro@example.com': ['dashboard', 'financeiro'],
    'cadastro@example.com': ['dashboard', 'cadastro', 'tecnicos'],


    // --------------------------------------------------
};

/**
 * Retorna as permissões de um usuário com base no e-mail.
 * Se o e-mail não for encontrado, retorna um array vazio (sem acesso).
 * @param email O e-mail do usuário.
 * @returns Um array de permissões.
 */
export const getUserPermissions = (email: string): Permission[] => {
    // O usuário com permissão 'admin' tem acesso a todas as telas.
    if (permissions[email]?.includes('admin')) {
        return [
            'admin', 'dashboard', 'cadastro', 'engenharia', 'tecnica', 
            'digitacao', 'medicina', 'financeiro', 'tecnicos', 'vencidos', 
            'arquivo-morto'
        ];
    }
    return permissions[email] || [];
};
