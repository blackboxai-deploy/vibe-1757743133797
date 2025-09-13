'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataManager } from '@/lib/data-manager';
import { formatarDuracao, formatarDataHora, formatarTempoPreciso } from '@/lib/calculations';
import { Sessao, Meta } from '@/types';

interface SessaoComMeta extends Sessao {
  meta?: Meta;
}

export function RecentSessions() {
  const [sessoes, setSessoes] = useState<SessaoComMeta[]>([]);
  const router = useRouter();

  useEffect(() => {
    const carregarSessoes = () => {
      const sessoesRecentes = DataManager.obterSessoes().slice(0, 5);
      const metas = DataManager.obterMetas();
      
      const sessoesComMeta = sessoesRecentes.map(sessao => ({
        ...sessao,
        meta: metas.find(m => m.id === sessao.metaId)
      }));
      
      setSessoes(sessoesComMeta);
    };

    carregarSessoes();
  }, []);

  const getSessionIcon = (tipo: string): string => {
    return tipo === 'cronometro' ? '⏱️' : '📝';
  };

  const getTimeIcon = (duracao: number): string => {
    if (duracao >= 240) return '🏃'; // 4+ horas
    if (duracao >= 120) return '💪'; // 2+ horas
    if (duracao >= 60) return '⏰'; // 1+ hora
    return '📝'; // menos de 1 hora
  };

  if (sessoes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            Sessões Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Nenhuma sessão registrada
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Comece registrando sua primeira sessão de prática
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => router.push('/cronometro')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                Usar Cronômetro
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/registrar')}
              >
                Registrar Manual
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            Sessões Recentes
            <Badge variant="secondary">
              {sessoes.length}
            </Badge>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/historico')}
          >
            Ver Histórico
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessoes.map((sessao, index) => (
            <div 
              key={sessao.id}
              className="flex items-center gap-4 p-4 rounded-lg border bg-slate-50 dark:bg-slate-800 hover:shadow-sm transition-all duration-200 cursor-pointer"
              onClick={() => router.push(`/historico?sessao=${sessao.id}`)}
            >
              {/* Ícone e tipo */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-lg">
                    {getSessionIcon(sessao.tipo)}
                  </span>
                </div>
              </div>

              {/* Informações principais */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-slate-900 dark:text-white truncate">
                    {sessao.meta?.titulo || 'Meta removida'}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {sessao.tipo === 'cronometro' ? 'Cronômetro' : 'Manual'}
                  </Badge>
                </div>
                
                 <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    {getTimeIcon(sessao.duracao)}
                    {formatarTempoPreciso(Math.round(sessao.duracao * 60))}
                  </span>
                  <span>•</span>
                  <span>
                    {formatarDataHora(new Date(sessao.data))}
                  </span>
                </div>

                {sessao.observacoes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                    "{sessao.observacoes}"
                  </p>
                )}
              </div>

              {/* Indicadores visuais */}
              <div className="flex-shrink-0 text-right">
                {sessao.meta && (
                  <div 
                    className="w-3 h-3 rounded-full mb-1"
                    style={{ backgroundColor: sessao.meta.cor }}
                    title={`Categoria: ${sessao.meta.categoria}`}
                  />
                )}
                <div className="text-xs text-slate-400">
                  {index === 0 && '🕒 Mais recente'}
                  {sessao.duracao >= 240 && '🏃 Sessão longa'}
                  {sessao.pausas && sessao.pausas > 0 && `⏸️ ${sessao.pausas} pausas`}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo do dia */}
        {sessoes.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">📊</span>
                <div>
                  <h4 className="font-medium text-sm text-slate-900 dark:text-white">
                    Resumo de Hoje
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {(() => {
                      const hoje = new Date().toDateString();
                      const sessoesHoje = sessoes.filter(s => 
                        new Date(s.data).toDateString() === hoje
                      );
                      const horasHoje = sessoesHoje.reduce((total, s) => total + s.duracao, 0);
                      const metasHoje = new Set(sessoesHoje.map(s => s.metaId)).size;
                      
                      if (sessoesHoje.length === 0) {
                        return 'Ainda não há sessões hoje';
                      }
                      
                       return `${formatarTempoPreciso(horasHoje)} em ${sessoesHoje.length} sessão${sessoesHoje.length > 1 ? 'ões' : ''} • ${metasHoje} meta${metasHoje > 1 ? 's' : ''}`;
                    })()}
                  </p>
                </div>
              </div>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/cronometro');
                }}
              >
                Continuar Praticando
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}