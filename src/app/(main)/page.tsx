
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Service } from './engenharia/page';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardCards } from '@/components/dashboard-cards';
import { StatusChart } from '@/components/status-chart';
import { RecentServicesTable } from '@/components/recent-services-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'servicos'));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const servicesData: Service[] = [];
        querySnapshot.forEach((doc) => {
          servicesData.push({ id: doc.id, ...doc.data() } as Service);
        });
        setServices(servicesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching services for dashboard:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="col-span-4 h-80" />
            <Skeleton className="col-span-3 h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
      <DashboardCards services={services} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
            <CardHeader>
                <CardTitle>Visão Geral por Status</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <StatusChart services={services} />
            </CardContent>
        </Card>
        <Card className="lg:col-span-3">
             <CardHeader>
                <CardTitle>Serviços Recentes</CardTitle>
            </CardHeader>
            <CardContent>
                <RecentServicesTable services={services} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
