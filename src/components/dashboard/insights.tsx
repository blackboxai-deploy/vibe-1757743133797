'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DataManager } from '@/lib/data-manager';
import { gerarInsights, formatarHoras, calcularProgresso } from '@/lib/calculations';
import { Meta } from '@/types';

export function Insights() {
  const [insights, setInsights] = useState<string[]>([]);
  const [melhorMeta, setMelhorMeta] = useState<Meta | null>(null);
  const [proximaConquista, setProximaConquista] = useState<any>(null);

  useEffect(() => {
    const carregarInsights = () => {
      const metas = DataManager.obterMetas(true);
      const sessoes = DataManager.obterSessoes();
      
      // Gerar insights automáticos
      const insightsGerados = gerarInsights(metas, sessoes);
      setInsights(insightsGerados);

      // Encontrar meta com melhor progresso
      if (metas.length > 0) {
        const metaComMelhorProgresso = metas.reduce((melhor, atual) => {
          const progressoAtual = calcularProgresso(atual.horasRegistradas, atual.horasObjetivo);
          const progressoMelhor = melhor ? calcularProgresso(melhor.horasRegistradas, melhor.horasObjetivo) : 0;
          return progressoAtual > progressoMelhor ? atual : melhor;
        }, null as Meta | null);
        
        setMelhorMeta(metaComMelhorProgresso);
      }

      // Calcular próxima conquista
      const horasTotal = sessoes.reduce((total, s) => total + (s.duracao / 60), 0);
      const marcosHoras = [1, 10, 50, 100, 500, 1000, 2500, 5000, 7500, 10000];
      const proximoMarco = marcosHoras.find(marco => marco > horasTotal);
      
      if (proximoMarco) {
        setProximaConquista({
          titulo: getConquistaTitulo(proximoMarco),
          horasRestantes: proximoMarco - horasTotal,
          progresso: (horasTotal / proximoMarco) * 100
        });
      }
    };

    carregarInsights();
  }, []);

  const getConquistaTitulo = (horas: number): string => {
    const titulos: Record<number, string> = {
      1: 'Primeiros Passos',
      10: 'Dedicação',
      50: 'Persistência',
      100: 'Centena',
      500: 'Meio Caminho',
      1000: 'Milhar',
      2500: 'Expert em Formação',
      5000: 'Quase Mestre',
      7500: 'Rumo à Maestria',
      10000: 'MESTRE - 10.000 Horas!'
    };
    return titulos[horas] || 'Conquista Especial';
  };

  const getInsightIcon = (insight: string): string => {
    if (insight.includes('consecutivos')) return '🔥';
    if (insight.includes('semana')) return '📈';
    if (insight.includes('concluída')) return '🎯';
    if (insight.includes('acumulou')) return '🏆';
    return '💡';
  };

  return (
    <div className="space-y-4">
      {/* Card de Insights Motivacionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            Insights & Motivação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-100 dark:border-blue-900"
                >
                  <span className="text-lg">{getInsightIcon(insight)}</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🌱</div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                Comece sua jornada!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Registre suas primeiras horas para receber insights personalizados
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card da Meta em Destaque */}
      {melhorMeta && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🌟</span>
              Meta em Destaque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {melhorMeta.titulo}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {melhorMeta.descricao}
                  </p>
                </div>
                <Badge 
                  variant="secondary"
                  className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                >
                  Melhor Progresso
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Progresso</span>
                  <span className="font-medium">
                    {formatarHoras(melhorMeta.horasRegistradas)} / {formatarHoras(melhorMeta.horasObjetivo)}
                  </span>
                </div>
                <Progress 
                  value={calcularProgresso(melhorMeta.horasRegistradas, melhorMeta.horasObjetivo)}
                  className="h-2"
                />
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {calcularProgresso(melhorMeta.horasRegistradas, melhorMeta.horasObjetivo).toFixed(1)}% concluído
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card da Próxima Conquista */}
      {proximaConquista && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🎖️</span>
              Próxima Conquista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">
                  {proximaConquista.titulo}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Faltam apenas {formatarHoras(proximaConquista.horasRestantes)} para desbloquear!
                </p>
              </div>

              <div className="space-y-2">
                <Progress 
                  value={proximaConquista.progresso}
                  className="h-3"
                />
                <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
                  {proximaConquista.progresso.toFixed(1)}% do caminho percorrido
                </p>
              </div>

              <div className="text-center p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Continue praticando para desbloquear sua próxima conquista! 💪
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frase motivacional */}
      <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
        <CardContent className="p-6 text-center">
          <div className="text-3xl mb-3">✨</div>
          <h3 className="font-bold text-lg mb-2">
            "Excelência não é um ato, mas um hábito."
          </h3>
          <p className="text-sm opacity-90">
            - Aristóteles
          </p>
          <div className="mt-4 text-xs opacity-75">
            Cada hora praticada é um passo rumo à maestria
          </div>
        </CardContent>
      </Card>
    </div>
  );
}