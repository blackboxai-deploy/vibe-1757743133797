'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataManager } from '@/lib/data-manager';
import { calcularEstatisticasDiarias, formatarHoras } from '@/lib/calculations';
import { EstatisticaDia } from '@/types';

export function ProgressChart() {
  const [dadosGrafico, setDadosGrafico] = useState<EstatisticaDia[]>([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<7 | 30>(7);

  useEffect(() => {
    const carregarDados = () => {
      const sessoes = DataManager.obterSessoes();
      const estatisticas = calcularEstatisticasDiarias(sessoes, periodoSelecionado);
      setDadosGrafico(estatisticas);
    };

    carregarDados();
  }, [periodoSelecionado]);

  const maxHoras = Math.max(...dadosGrafico.map(d => d.horasTotal), 1);
  const totalHoras = dadosGrafico.reduce((total, d) => total + d.horasTotal, 0);
  const mediaHoras = totalHoras / periodoSelecionado;

  const obterNomeDia = (data: Date): string => {
    return data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  };

  const obterCorBarra = (horas: number): string => {
    const porcentagem = (horas / maxHoras) * 100;
    if (porcentagem >= 80) return 'bg-green-500';
    if (porcentagem >= 60) return 'bg-blue-500';
    if (porcentagem >= 40) return 'bg-yellow-500';
    if (porcentagem >= 20) return 'bg-orange-500';
    return 'bg-slate-300';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            Progresso Diário
          </CardTitle>
          <div className="flex gap-2">
            <Badge 
              variant={periodoSelecionado === 7 ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setPeriodoSelecionado(7)}
            >
              7 dias
            </Badge>
            <Badge 
              variant={periodoSelecionado === 30 ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setPeriodoSelecionado(30)}
            >
              30 dias
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {dadosGrafico.length > 0 ? (
          <div className="space-y-6">
            {/* Estatísticas do período */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatarHoras(totalHoras)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Total
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatarHoras(mediaHoras)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Média/dia
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {dadosGrafico.filter(d => d.horasTotal > 0).length}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Dias ativos
                </div>
              </div>
            </div>

            {/* Gráfico de barras */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300">
                Horas por dia
              </h4>
              <div className="grid grid-cols-7 gap-2">
                {dadosGrafico.slice(-7).map((dia, index) => {
                  const altura = maxHoras > 0 ? (dia.horasTotal / maxHoras) * 100 : 0;
                  const isToday = dia.data.toDateString() === new Date().toDateString();
                  
                  return (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <div className="w-full h-24 bg-slate-100 dark:bg-slate-800 rounded-md relative overflow-hidden">
                        <div 
                          className={`absolute bottom-0 left-0 w-full transition-all duration-500 ${obterCorBarra(dia.horasTotal)}`}
                          style={{ height: `${altura}%` }}
                        />
                        {dia.horasTotal > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-white drop-shadow">
                              {Math.round(dia.horasTotal * 10) / 10}h
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <div className={`text-xs font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                          {obterNomeDia(dia.data)}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {dia.data.getDate()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-slate-600 dark:text-slate-400">Excelente (80%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-slate-600 dark:text-slate-400">Bom (60%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-slate-600 dark:text-slate-400">Regular (40%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-300 rounded"></div>
                <span className="text-slate-600 dark:text-slate-400">Baixo</span>
              </div>
            </div>

            {/* Análise do padrão */}
            {totalHoras > 0 && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <span className="text-lg">📊</span>
                  <div>
                    <h4 className="font-medium text-sm text-slate-900 dark:text-white mb-1">
                      Análise do Período
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {mediaHoras >= 2 
                        ? "Excelente consistência! Você está no caminho certo para formar um hábito sólido." 
                        : mediaHoras >= 1
                        ? "Boa frequência de prática. Tente aumentar gradualmente o tempo diário."
                        : "Tente manter uma rotina mais consistente. Pequenas práticas diárias fazem toda diferença."
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Nenhum dado ainda
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Comece a registrar suas horas para ver seu progresso
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}