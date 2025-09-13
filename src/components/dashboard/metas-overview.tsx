'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DataManager } from '@/lib/data-manager';
import { formatarHoras, calcularProgresso } from '@/lib/calculations';
import { Meta } from '@/types';

export function MetasOverview() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const router = useRouter();

  useEffect(() => {
    const carregarMetas = () => {
      const metasAtivas = DataManager.obterMetas(true);
      // Mostrar até 4 metas, priorizando as com maior progresso
      const metasOrdenadas = metasAtivas
        .sort((a, b) => calcularProgresso(b.horasRegistradas, b.horasObjetivo) - calcularProgresso(a.horasRegistradas, a.horasObjetivo))
        .slice(0, 4);
      setMetas(metasOrdenadas);
    };

    carregarMetas();
  }, []);

  if (metas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Suas Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Nenhuma meta criada ainda
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              Crie sua primeira meta de especialização e comece sua jornada rumo à maestria
            </p>
            <Button 
              onClick={() => router.push('/metas/nova')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              Criar Primeira Meta
            </Button>
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
            <span className="text-xl">🎯</span>
            Suas Metas
            <Badge variant="secondary" className="ml-2">
              {metas.length}
            </Badge>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/metas')}
          >
            Ver Todas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metas.map((meta) => {
            const progresso = calcularProgresso(meta.horasRegistradas, meta.horasObjetivo);
            const isQuaseConcluida = progresso >= 75;
            const isConcluida = progresso >= 100;

            return (
              <div 
                key={meta.id}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer ${
                  isConcluida 
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                    : isQuaseConcluida
                    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
                    : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                }`}
                onClick={() => router.push(`/metas/${meta.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                        {meta.titulo}
                      </h4>
                      {isConcluida && (
                        <Badge className="bg-green-600 text-white text-xs">
                          Concluída! 🎉
                        </Badge>
                      )}
                      {isQuaseConcluida && !isConcluida && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                          Quase lá!
                        </Badge>
                      )}
                    </div>
                    {meta.descricao && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {meta.descricao}
                      </p>
                    )}
                  </div>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ml-3 flex-shrink-0"
                    style={{ backgroundColor: meta.cor }}
                  >
                    {meta.categoria.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Progresso</span>
                    <span className="font-medium">
                      {formatarHoras(meta.horasRegistradas)} / {formatarHoras(meta.horasObjetivo)}
                    </span>
                  </div>
                  
                  <Progress 
                    value={progresso} 
                    className="h-2"
                  />
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-500">
                      {progresso.toFixed(1)}% concluído
                    </span>
                    <span className="text-slate-500 dark:text-slate-500">
                      {isConcluida 
                        ? 'Meta alcançada!' 
                        : `${formatarHoras(meta.horasObjetivo - meta.horasRegistradas)} restantes`
                      }
                    </span>
                  </div>
                </div>

                {/* Indicador de atividade recente */}
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-500">
                      Categoria: {meta.categoria}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">
                      Criada em {new Date(meta.dataCriacao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Botão para criar nova meta se houver espaço */}
          {metas.length < 4 && (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <div className="text-2xl mb-2">➕</div>
              <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                Adicionar Nova Meta
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Defina mais um objetivo de especialização
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/metas/nova');
                }}
              >
                Criar Meta
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}