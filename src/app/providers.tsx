
'use client';

import { AuthProvider } from '@/context/auth-context';
import { ServiceNotificationProvider } from '@/context/service-notification-context';


export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ServiceNotificationProvider>
                {children}
            </ServiceNotificationProvider>
        </AuthProvider>
    )
}
