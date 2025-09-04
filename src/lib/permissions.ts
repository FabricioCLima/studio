
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

const permissions: { [email: string]: Permission[] } = {
    // --- Adicione aqui os e-mails e suas permissões ---
    'admin@example.com': ['admin'],
    'engenharia@example.com': ['dashboard', 'engenharia', 'vencidos'],
    'tecnica@example.com': ['dashboard', 'tecnica'],
    'digitacao@example.com': ['dashboard', 'digitacao'],
    'medicina@example.com': ['dashboard', 'medicina'],
    'financeiro@example.com': ['dashboard', 'financeiro'],
    // --------------------------------------------------
};

export const getUserPermissions = (email: string): Permission[] => {
    return permissions[email] || [];
};
