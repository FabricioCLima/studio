
'use client';

import { AuthProvider } from '@/context/auth-context';
import { ServiceNotificationProvider } from '@/context/service-notification-context';
import { ThemeProvider } from 'next-themes';


export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
                <ServiceNotificationProvider>
                    {children}
                </ServiceNotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}
