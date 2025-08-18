
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
} from 'lucide-react';
import { useServiceNotification } from '@/context/service-notification-context';
import { Button } from './ui/button';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cadastro', label: 'Cadastro', icon: FilePlus2 },
  { href: '/engenharia', label: 'Engenharia', icon: Hammer, notificationKey: 'engineering' },
  { href: '/tecnica', label: 'Técnica', icon: Cpu, notificationKey: 'tecnica' },
  { href: '/digitacao', label: 'Digitação', icon: Keyboard, notificationKey: 'digitacao' },
  { href: '/medicina', label: 'Medicina', icon: Stethoscope, notificationKey: 'medicina' },
  { href: '/tecnicos', label: 'Técnicos', icon: Users },
  { href: '/vencidos', label: 'Vencidos', icon: FileWarning },
  { href: '/arquivo-morto', label: 'Arquivo Morto', icon: Archive },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { engineeringCount, tecnicaCount, digitacaoCount, medicinaCount } = useServiceNotification();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const notificationCounts: { [key: string]: number } = {
    engineering: engineeringCount,
    tecnica: tecnicaCount,
    digitacao: digitacaoCount,
    medicina: medicinaCount,
  };

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
                {navItems.map((item) => {
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
