'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/layout/navigation';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { MetasOverview } from '@/components/dashboard/metas-overview';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { RecentSessions } from '@/components/dashboard/recent-sessions';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { Insights } from '@/components/dashboard/insights';
import { useApp } from '@/components/providers/app-provider';

export default function HomePage() {
  const { usuario, carregando } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !usuario) {
      router.push('/auth');
    }
  }, [usuario, carregando, router]);

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />
      
      <main className="flex-1 lg:ml-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Olá, {usuario.nome.split(' ')[0]}! 👋
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Vamos continuar sua jornada rumo à maestria
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric',
                    month: 'long'
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Estatísticas principais */}
            <div className="lg:col-span-12">
              <DashboardStats />
            </div>

            {/* Ações rápidas */}
            <div className="lg:col-span-12 xl:col-span-4">
              <QuickActions />
            </div>

            {/* Insights e motivação */}
            <div className="lg:col-span-12 xl:col-span-8">
              <Insights />
            </div>

            {/* Visão geral das metas */}
            <div className="lg:col-span-12 xl:col-span-6">
              <MetasOverview />
            </div>

            {/* Gráfico de progresso */}
            <div className="lg:col-span-12 xl:col-span-6">
              <ProgressChart />
            </div>

            {/* Sessões recentes */}
            <div className="lg:col-span-12">
              <RecentSessions />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}