'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/layout/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DataManager } from '@/lib/data-manager';
import { formatarHoras, calcularSequenciaConsecutiva } from '@/lib/calculations';
import { useApp } from '@/components/providers/app-provider';
import { Conquista, ConquistaUsuario } from '@/types';

interface ConquistaComStatus extends Conquista {
  desbloqueada: boolean;
  dataDesbloqueio?: Date;
  progresso: number;
  proximoMilestone?: number;
}

export default function ConquistasPage() {
  const { usuario } = useApp();
  const router = useRouter();
  
  const [conquistas, setConquistas] = useState<ConquistaComStatus[]>([]);
  // const [conquistasDesbloqueadas, setConquistasDesbloqueadas] = useState<ConquistaUsuario[]>([]);
  const [estatisticas, setEstatisticas] = useState({
    totalConquistas: 0,
    conquistasDesbloqueadas: 0,
    horasTotal: 0,
    sequenciaAtual: 0
  });

  useEffect(() => {
    if (!usuario) {
      router.push('/auth');
      return;
    }
    carregarConquistas();
  }, [usuario, router]);

  const carregarConquistas = () => {
    // Carregar conquistas base
    const conquistasBase = DataManager.obterConquistasBase();
    const conquistasUsuario = DataManager.obterConquistasUsuario();
    const sessoes = DataManager.obterSessoes();
    const metas = DataManager.obterMetas();
    
    // Calcular estatísticas atuais
    const horasTotal = sessoes.reduce((total, s) => total + (s.duracao / 60), 0);
    const sequenciaAtual = calcularSequenciaConsecutiva(sessoes);
    const metasCompletas = metas.filter(m => m.horasRegistradas >= m.horasObjetivo).length;
    const metasAtivas = metas.filter(m => m.ativa).length;
    
    // Processar cada conquista com seu status
    const conquistasComStatus: ConquistaComStatus[] = conquistasBase.map(conquista => {
      const conquistaUsuario = conquistasUsuario.find(cu => cu.conquistaId === conquista.id);
      const desbloqueada = !!conquistaUsuario;
      
      let progresso = 0;
      let proximoMilestone: number | undefined;
      
      // Calcular progresso baseado no tipo
      switch (conquista.tipo) {
        case 'horas':
          progresso = Math.min(100, (horasTotal / conquista.condicao) * 100);
          if (horasTotal < conquista.condicao) {
            proximoMilestone = conquista.condicao - horasTotal;
          }
          break;
          
        case 'consistencia':
          progresso = Math.min(100, (sequenciaAtual / conquista.condicao) * 100);
          if (sequenciaAtual < conquista.condicao) {
            proximoMilestone = conquista.condicao - sequenciaAtual;
          }
          break;
          
        case 'meta':
          progresso = Math.min(100, (metasCompletas / conquista.condicao) * 100);
          if (metasCompletas < conquista.condicao) {
            proximoMilestone = conquista.condicao - metasCompletas;
          }
          break;
          
        case 'especial':
          if (conquista.id === '14') { // Multi-talento
            progresso = Math.min(100, (metasAtivas / conquista.condicao) * 100);
            if (metasAtivas < conquista.condicao) {
              proximoMilestone = conquista.condicao - metasAtivas;
            }
          } else if (conquista.id === '15') { // Maratonista
            const maiorSessao = Math.max(...sessoes.map(s => s.duracao), 0);
            progresso = Math.min(100, (maiorSessao / conquista.condicao) * 100);
            if (maiorSessao < conquista.condicao) {
              proximoMilestone = conquista.condicao - maiorSessao;
            }
          }
          break;
      }
      
      return {
        ...conquista,
        desbloqueada,
        dataDesbloqueio: conquistaUsuario?.dataDesbloqueio ? new Date(conquistaUsuario.dataDesbloqueio) : undefined,
        progresso,
        proximoMilestone
      };
    });
    
    // Ordenar: desbloqueadas primeiro, depois por progresso
    conquistasComStatus.sort((a, b) => {
      if (a.desbloqueada && !b.desbloqueada) return -1;
      if (!a.desbloqueada && b.desbloqueada) return 1;
      if (a.desbloqueada && b.desbloqueada) {
        // Se ambas desbloqueadas, ordenar por data de desbloqueio (mais recente primeiro)
        return (b.dataDesbloqueio?.getTime() || 0) - (a.dataDesbloqueio?.getTime() || 0);
      }
      // Se nenhuma desbloqueada, ordenar por progresso (maior primeiro)
      return b.progresso - a.progresso;
    });
    
    setConquistas(conquistasComStatus);
    // setConquistasDesbloqueadas(conquistasUsuario);
    setEstatisticas({
      totalConquistas: conquistasBase.length,
      conquistasDesbloqueadas: conquistasUsuario.length,
      horasTotal,
      sequenciaAtual
    });
  };

  const obterCorConquista = (conquista: ConquistaComStatus): string => {
    if (conquista.desbloqueada) {
      return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20';
    }
    if (conquista.progresso >= 75) {
      return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20';
    }
    if (conquista.progresso >= 25) {
      return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20';
    }
    return 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800';
  };

  const formatarProximoMilestone = (conquista: ConquistaComStatus): string => {
    if (!conquista.proximoMilestone) return '';
    
    switch (conquista.tipo) {
      case 'horas':
        return `Faltam ${formatarHoras(conquista.proximoMilestone)}`;
      case 'consistencia':
        return `Faltam ${conquista.proximoMilestone} dias consecutivos`;
      case 'meta':
        return `Faltam ${conquista.proximoMilestone} meta${conquista.proximoMilestone > 1 ? 's' : ''}`;
      case 'especial':
        if (conquista.id === '14') {
          return `Faltam ${conquista.proximoMilestone} meta${conquista.proximoMilestone > 1 ? 's' : ''} ativas`;
        } else if (conquista.id === '15') {
          const horasRestantes = (conquista.proximoMilestone / 60);
          return `Faltam ${formatarHoras(horasRestantes)} em uma sessão`;
        }
        return '';
      default:
        return '';
    }
  };

  if (!usuario) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />
      
      <main className="flex-1 lg:ml-80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              🏆 Conquistas
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Seus marcos e badges de progresso
            </p>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {estatisticas.conquistasDesbloqueadas}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Conquistas Desbloqueadas
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {estatisticas.totalConquistas}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Total de Conquistas
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatarHoras(estatisticas.horasTotal)}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Horas Acumuladas
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {estatisticas.sequenciaAtual}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Sequência Atual
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progresso Geral */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Progresso Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Conquistas desbloqueadas
                  </span>
                  <span className="font-medium">
                    {estatisticas.conquistasDesbloqueadas} / {estatisticas.totalConquistas}
                  </span>
                </div>
                
                <Progress 
                  value={(estatisticas.conquistasDesbloqueadas / estatisticas.totalConquistas) * 100}
                  className="h-3"
                />
                
                <p className="text-center text-lg font-bold text-slate-900 dark:text-white">
                  {((estatisticas.conquistasDesbloqueadas / estatisticas.totalConquistas) * 100).toFixed(1)}% 
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    de todas as conquistas
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Conquistas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conquistas.map((conquista) => (
              <Card 
                key={conquista.id}
                className={`transition-all duration-200 hover:shadow-md ${obterCorConquista(conquista)}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Ícone */}
                    <div className={`text-4xl ${conquista.desbloqueada ? '' : 'grayscale opacity-50'}`}>
                      {conquista.icone}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-bold ${conquista.desbloqueada ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                          {conquista.titulo}
                        </h3>
                        
                        {conquista.desbloqueada && (
                          <Badge className="bg-yellow-500 text-white text-xs">
                            ✓ Desbloqueada
                          </Badge>
                        )}
                        
                        {!conquista.desbloqueada && conquista.progresso >= 75 && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                            Quase lá!
                          </Badge>
                        )}
                      </div>
                      
                      <p className={`text-sm mb-3 ${conquista.desbloqueada ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        {conquista.descricao}
                      </p>
                      
                      {/* Progresso */}
                      {!conquista.desbloqueada && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Progresso</span>
                            <span className="font-medium">
                              {conquista.progresso.toFixed(1)}%
                            </span>
                          </div>
                          
                          <Progress 
                            value={conquista.progresso}
                            className="h-2"
                          />
                          
                          {conquista.proximoMilestone && (
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              {formatarProximoMilestone(conquista)}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Data de desbloqueio */}
                      {conquista.desbloqueada && conquista.dataDesbloqueio && (
                        <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Desbloqueada em {conquista.dataDesbloqueio.toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Motivação */}
          <Card className="mt-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">
                Continue praticando!
              </h3>
              <p className="text-sm opacity-90 mb-4">
                Cada hora de prática te aproxima de novas conquistas e da maestria.
              </p>
              <div className="text-xs opacity-75">
                {estatisticas.conquistasDesbloqueadas < estatisticas.totalConquistas 
                  ? `Faltam ${estatisticas.totalConquistas - estatisticas.conquistasDesbloqueadas} conquistas para completar todas!`
                  : '🎉 Parabéns! Você desbloqueou todas as conquistas!'
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}