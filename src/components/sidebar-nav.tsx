
'use client';

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarHeader,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import {
  Archive,
  Cpu,
  FilePlus2,
  Hammer,
  Keyboard,
  LayoutDashboard,
  Stethoscope,
  LogOut,
  Users,
  FileWarning,
  DollarSign,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useServiceNotification } from '@/context/service-notification-context';
import { Button } from './ui/button';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth, type Permission } from '@/context/auth-context';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  notificationKey?: 'engineering' | 'tecnica' | 'digitacao' | 'medicina' | 'financeiro';
};

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { href: '/cadastro', label: 'Cadastro', icon: FilePlus2, permission: 'cadastro' },
  { href: '/engenharia', label: 'Engenharia', icon: Hammer, permission: 'engenharia', notificationKey: 'engineering' },
  { href: '/tecnica', label: 'Técnica', icon: Cpu, permission: 'tecnica', notificationKey: 'tecnica' },
  { href: '/digitacao', label: 'Digitação', icon: Keyboard, permission: 'digitacao', notificationKey: 'digitacao' },
  { href: '/medicina', label: 'Medicina', icon: Stethoscope, permission: 'medicina', notificationKey: 'medicina' },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign, permission: 'financeiro', notificationKey: 'financeiro' },
  { href: '/pgr', label: 'PGR', icon: ShieldCheck, permission: 'pgr' },
  { href: '/tecnicos', label: 'Técnicos', icon: Users, permission: 'tecnicos' },
  { href: '/vencidos', label: 'Vencidos', icon: FileWarning, permission: 'vencidos' },
  { href: '/arquivo-morto', label: 'Arquivo Morto', icon: Archive, permission: 'arquivo-morto' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { engineeringCount, tecnicaCount, digitacaoCount, medicinaCount, financeiroCount } = useServiceNotification();
  const router = useRouter();
  const { user, permissions } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const notificationCounts: { [key: string]: number } = {
    engineering: engineeringCount,
    tecnica: tecnicaCount,
    digitacao: digitacaoCount,
    medicina: medicinaCount,
    financeiro: financeiroCount,
  };

  const hasPermission = (permission: Permission) => {
    return permissions.includes('admin') || permissions.includes(permission);
  }

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight group-data-[collapsible=icon]:hidden">Service Flow</h2>
            <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
            <SidebarMenu>
                {navItems.filter(item => hasPermission(item.permission)).map((item) => {
                  const count = item.notificationKey ? notificationCounts[item.notificationKey] : 0;
                  return (
                      <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                              asChild
                              isActive={pathname === item.href}
                              onClick={() => router.push(item.href)}
                              tooltip={item.label}
                          >
                              <a>
                                  <item.icon className="h-6 w-6" />
                                  <span>{item.label}</span>
                                  {count > 0 && <SidebarMenuBadge>{count}</SidebarMenuBadge>}
                              </a>
                          </SidebarMenuButton>
                      </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarHeader>
        <SidebarGroup>
            <SidebarGroupLabel>{user?.email}</SidebarGroupLabel>
            <Button variant="ghost" className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2" onClick={handleLogout}>
              <LogOut size={20} />
              <span className="group-data-[collapsible=icon]:hidden">Sair</span>
            </Button>
        </SidebarGroup>
      </SidebarHeader>
    </>
  );
}
