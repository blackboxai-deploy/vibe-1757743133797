'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataManager } from '@/lib/data-manager';
import { formatarHoras, calcularSequenciaConsecutiva } from '@/lib/calculations';

interface Estatisticas {
  totalMetas: number;
  metasAtivas: number;
  horasTotal: number;
  totalSessoes: number;
  horasUltimaSemana: number;
  sessoesUltimaSemana: number;
  mediaHorasPorDia: number;
  sequenciaConsecutiva: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Estatisticas | null>(null);

  useEffect(() => {
    const carregarEstatisticas = () => {
      const estatisticasGerais = DataManager.obterEstatisticasGerais();
      const sessoes = DataManager.obterSessoes();
      const sequenciaConsecutiva = calcularSequenciaConsecutiva(sessoes);

      setStats({
        ...estatisticasGerais,
        sequenciaConsecutiva
      });
    };

    carregarEstatisticas();
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const estatisticasCards = [
    {
      titulo: 'Total de Horas',
      valor: formatarHoras(stats.horasTotal),
      icon: '⏰',
      gradiente: 'from-blue-500 to-cyan-500',
      descricao: 'Horas praticadas até agora'
    },
    {
      titulo: 'Metas Ativas',
      valor: `${stats.metasAtivas}/${stats.totalMetas}`,
      icon: '🎯',
      gradiente: 'from-purple-500 to-pink-500',
      descricao: 'Metas em andamento'
    },
    {
      titulo: 'Esta Semana',
      valor: formatarHoras(stats.horasUltimaSemana),
      icon: '📅',
      gradiente: 'from-green-500 to-emerald-500',
      descricao: `${stats.sessoesUltimaSemana} sessões registradas`
    },
    {
      titulo: 'Sequência',
      valor: `${stats.sequenciaConsecutiva} dias`,
      icon: '🔥',
      gradiente: 'from-orange-500 to-red-500',
      descricao: stats.sequenciaConsecutiva > 0 ? 'Dias consecutivos praticando' : 'Nenhuma sequência ativa'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {estatisticasCards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradiente} opacity-5 group-hover:opacity-10 transition-opacity`} />
          
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              {card.titulo === 'Sequência' && stats.sequenciaConsecutiva >= 7 && (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                  Em Chamas!
                </Badge>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {card.titulo}
              </p>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {card.valor}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 leading-tight">
                {card.descricao}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Card adicional com progresso geral */}
      <Card className="col-span-2 lg:col-span-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-5" />
        
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl">
                ⭐
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Status da Jornada
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Média de {formatarHoras(stats.mediaHorasPorDia)} por dia
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {stats.totalSessoes > 0 && (
                <Badge variant="outline" className="text-xs">
                  {stats.totalSessoes} sessões
                </Badge>
              )}
              
              {stats.horasTotal >= 100 && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  +100 horas
                </Badge>
              )}
              
              {stats.sequenciaConsecutiva >= 7 && (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                  Consistente
                </Badge>
              )}
              
              {stats.metasAtivas >= 3 && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                  Multi-foco
                </Badge>
              )}
            </div>
          </div>

          {/* Barra de progresso visual */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Progresso geral</span>
              <span>{((stats.horasTotal / 10000) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, (stats.horasTotal / 10000) * 100)}%` 
                }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              {formatarHoras(Math.max(0, 10000 - stats.horasTotal))} restantes para 10.000 horas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}