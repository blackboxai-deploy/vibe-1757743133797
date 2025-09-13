'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/layout/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DataManager } from '@/lib/data-manager';
import { formatarDuracao, formatarDataHora, formatarTempoPreciso } from '@/lib/calculations';
import { useApp } from '@/components/providers/app-provider';
import { Meta, Sessao, FiltroSessoes, OrdenacaoSessoes } from '@/types';
import { toast } from 'sonner';

interface SessaoComMeta extends Sessao {
  meta?: Meta;
}

export default function HistoricoPage() {
  const { usuario } = useApp();
  const router = useRouter();
  // const searchParams = useSearchParams(); // Para futuras funcionalidades
  
  const [sessoes, setSessoes] = useState<SessaoComMeta[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [filtros, setFiltros] = useState<FiltroSessoes>({});
  const [ordenacao, setOrdenacao] = useState<OrdenacaoSessoes>({
    campo: 'data',
    direcao: 'desc'
  });

  useEffect(() => {
    if (!usuario) {
      router.push('/auth');
      return;
    }
    carregarDados();
  }, [usuario, router]);

  const carregarDados = () => {
    const sessoesDados = DataManager.obterSessoes(filtros, ordenacao);
    const metasDados = DataManager.obterMetas();
    
    // Adicionar informações da meta a cada sessão
    const sessoesComMeta = sessoesDados.map(sessao => ({
      ...sessao,
      meta: metasDados.find(m => m.id === sessao.metaId)
    }));
    
    setSessoes(sessoesComMeta);
    setMetas(metasDados);
  };

  useEffect(() => {
    carregarDados();
  }, [filtros, ordenacao]);

  const aplicarFiltros = (novosFiltros: Partial<FiltroSessoes>) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  };

  const limparFiltros = () => {
    setFiltros({});
  };

  const excluirSessao = async (sessaoId: string) => {
    try {
      DataManager.excluirSessao(sessaoId);
      carregarDados();
      toast.success('Sessão excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir sessão');
      console.error(error);
    }
  };

   const editarSessao = (sessaoId: string) => {
    router.push(`/historico/${sessaoId}/editar`);
  };

  const estatisticas = {
    totalSessoes: sessoes.length,
    horasTotal: sessoes.reduce((total, s) => total + (s.duracao / 60), 0),
    mediaDuracao: sessoes.length > 0 ? sessoes.reduce((total, s) => total + s.duracao, 0) / sessoes.length : 0,
    metasUnicas: new Set(sessoes.map(s => s.metaId)).size
  };

  const periodos = {
    hoje: new Date().toDateString(),
    semana: (() => {
      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);
      return semanaAtras;
    })(),
    mes: (() => {
      const mesAtras = new Date();
      mesAtras.setMonth(mesAtras.getMonth() - 1);
      return mesAtras;
    })()
  };

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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              📈 Histórico
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Veja seus registros e estatísticas
            </p>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {estatisticas.totalSessoes}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Total de Sessões
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatarDuracao(Math.round(estatisticas.horasTotal * 60))}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Horas Totais
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatarDuracao(Math.round(estatisticas.mediaDuracao))}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Duração Média
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {estatisticas.metasUnicas}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Metas Praticadas
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Busca por meta */}
                <div>
                  <Select 
                    value={filtros.metaId || ''} 
                    onValueChange={(value) => aplicarFiltros({ metaId: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as metas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as metas</SelectItem>
                      {metas.map((meta) => (
                        <SelectItem key={meta.id} value={meta.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: meta.cor }}
                            />
                            {meta.titulo}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo */}
                <div>
                  <Select 
                    value={filtros.tipo || ''} 
                    onValueChange={(value) => aplicarFiltros({ tipo: value as any || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os tipos</SelectItem>
                      <SelectItem value="cronometro">Cronômetro</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Período */}
                <div>
                  <Select 
                    value=""
                    onValueChange={(value) => {
                      if (value === 'hoje') {
                        const hoje = new Date();
                        hoje.setHours(0, 0, 0, 0);
                        aplicarFiltros({ dataInicio: hoje, dataFim: new Date() });
                      } else if (value === 'semana') {
                        aplicarFiltros({ dataInicio: periodos.semana, dataFim: new Date() });
                      } else if (value === 'mes') {
                        aplicarFiltros({ dataInicio: periodos.mes, dataFim: new Date() });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="semana">Última semana</SelectItem>
                      <SelectItem value="mes">Último mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Ordenação */}
                <div>
                  <Select 
                    value={`${ordenacao.campo}-${ordenacao.direcao}`}
                    onValueChange={(value) => {
                      const [campo, direcao] = value.split('-') as [any, 'asc' | 'desc'];
                      setOrdenacao({ campo, direcao });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data-desc">Mais recente</SelectItem>
                      <SelectItem value="data-asc">Mais antigo</SelectItem>
                      <SelectItem value="duracao-desc">Maior duração</SelectItem>
                      <SelectItem value="duracao-asc">Menor duração</SelectItem>
                      <SelectItem value="meta-asc">Meta (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Limpar filtros */}
                <div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={limparFiltros}
                  >
                    Limpar
                  </Button>
                </div>
              </div>

              {/* Filtros ativos */}
              {(filtros.metaId || filtros.tipo || filtros.dataInicio) && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  {filtros.metaId && (
                    <Badge variant="outline" className="gap-2">
                      Meta: {metas.find(m => m.id === filtros.metaId)?.titulo}
                      <button 
                        onClick={() => aplicarFiltros({ metaId: undefined })}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  
                  {filtros.tipo && (
                    <Badge variant="outline" className="gap-2">
                      Tipo: {filtros.tipo === 'cronometro' ? 'Cronômetro' : 'Manual'}
                      <button 
                        onClick={() => aplicarFiltros({ tipo: undefined })}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  
                  {filtros.dataInicio && (
                    <Badge variant="outline" className="gap-2">
                      Período aplicado
                      <button 
                        onClick={() => aplicarFiltros({ dataInicio: undefined, dataFim: undefined })}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Sessões */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Sessões ({sessoes.length})
                </CardTitle>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/registrar')}
                  >
                    Nova Sessão
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sessoes.length > 0 ? (
                <div className="space-y-3">
                  {sessoes.map((sessao) => (
                    <div 
                      key={sessao.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {/* Informações principais */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {sessao.meta ? (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: sessao.meta.cor }}
                              />
                              <h4 className="font-medium text-slate-900 dark:text-white">
                                {sessao.meta.titulo}
                              </h4>
                            </div>
                          ) : (
                            <h4 className="font-medium text-slate-500">
                              Meta removida
                            </h4>
                          )}
                          
                          <Badge variant="outline" className="text-xs">
                            {sessao.tipo === 'cronometro' ? '⏱️ Cronômetro' : '📝 Manual'}
                          </Badge>
                        </div>
                        
                         <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="font-mono font-bold">
                              {formatarTempoPreciso(Math.round(sessao.duracao * 60))}
                            </span>
                          </span>
                          
                          <span>
                            {formatarDataHora(new Date(sessao.data))}
                          </span>
                          
                          {sessao.pausas > 0 && (
                            <span>⏸️ {sessao.pausas} pausas</span>
                          )}
                        </div>
                        
                        {sessao.observacoes && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 italic">
                            "{sessao.observacoes}"
                          </p>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2 sm:flex-col">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editarSessao(sessao.id)}
                        >
                          Editar
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir sessão?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A sessão será removida permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => excluirSessao(sessao.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📈</div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    {Object.keys(filtros).length > 0 ? 'Nenhuma sessão encontrada' : 'Nenhuma sessão registrada'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    {Object.keys(filtros).length > 0 
                      ? 'Tente ajustar os filtros ou registrar uma nova sessão'
                      : 'Comece registrando sua primeira sessão de prática'
                    }
                  </p>
                  <div className="flex gap-3 justify-center">
                    {Object.keys(filtros).length > 0 && (
                      <Button 
                        variant="outline"
                        onClick={limparFiltros}
                      >
                        Limpar Filtros
                      </Button>
                    )}
                    <Button 
                      onClick={() => router.push('/registrar')}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      Registrar Sessão
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}