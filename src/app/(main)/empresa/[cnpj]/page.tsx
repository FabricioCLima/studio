
'use client';

import type { Service } from '@/app/(main)/engenharia/page';
import { EmpresaServicesTable } from '@/components/empresa-services-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EmpresaDetailsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [companyInfo, setCompanyInfo] = useState<{nomeEmpresa: string, cnpj: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const cnpj = params.cnpj as string;

  useEffect(() => {
    if (!user || !cnpj) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'servicos'), where('cnpj', '==', cnpj));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const servicesData: Service[] = [];
      querySnapshot.forEach((doc) => {
        servicesData.push({ id: doc.id, ...doc.data() } as Service);
      });

      if (servicesData.length > 0) {
          setCompanyInfo({
              nomeEmpresa: servicesData[0].nomeEmpresa,
              cnpj: servicesData[0].cnpj
          })
      }

      setServices(servicesData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching company services:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, cnpj]);

  if (loading) {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Skeleton className="h-8 w-1/4 mb-4" />
            <Skeleton className="h-10 w-1/3 mb-2" />
            <Skeleton className="h-6 w-1/4 mb-6" />
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    )
  }

  if (!companyInfo) {
      return (
         <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p>Nenhuma informação encontrada para esta empresa.</p>
                </CardContent>
            </Card>
      </div>
      )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Button variant="outline" onClick={() => router.push('/pgr')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a Lista de Empresas
        </Button>
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">{companyInfo.nomeEmpresa}</CardTitle>
                <CardDescription>CNPJ: {companyInfo.cnpj}</CardDescription>
            </CardHeader>
            <CardContent>
                <h2 className="text-xl font-semibold tracking-tight mb-4">Histórico de Serviços</h2>
                <EmpresaServicesTable services={services} />
            </CardContent>
        </Card>
    </div>
  );
}
