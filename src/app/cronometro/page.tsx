'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/layout/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DataManager } from '@/lib/data-manager';
import { formatarDuracao, formatarTempoPreciso, calcularProgresso } from '@/lib/calculations';
import { useApp } from '@/components/providers/app-provider';
import { Meta, EstadoCronometro } from '@/types';
import { toast } from 'sonner';

export default function CronometroPage() {
  const { usuario } = useApp();
  const router = useRouter();
  
  const [metas, setMetas] = useState<Meta[]>([]);
  const [metaSelecionada, setMetaSelecionada] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');
  
  // Estado do cronômetro
  const [estadoCronometro, setEstadoCronometro] = useState<EstadoCronometro>({
    status: 'parado',
    tempoDecorrido: 0,
    totalPausas: 0
  });

  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!usuario) {
      router.push('/auth');
      return;
    }
    carregarMetas();
    carregarEstadoSalvo();
  }, [usuario, router]);

  const carregarMetas = () => {
    const metasAtivas = DataManager.obterMetas(true);
    setMetas(metasAtivas);
  };

  const carregarEstadoSalvo = () => {
    const estadoSalvo = localStorage.getItem('cronometro_estado');
    if (estadoSalvo) {
      try {
        const estado: EstadoCronometro = JSON.parse(estadoSalvo);
        
        // Se estava rodando, calcular tempo adicional
        if (estado.status === 'rodando' && estado.iniciadoEm) {
          const agora = new Date().getTime();
          const iniciadoEm = new Date(estado.iniciadoEm).getTime();
          const tempoAdicional = Math.floor((agora - iniciadoEm) / 1000);
          estado.tempoDecorrido += tempoAdicional;
        }
        
        setEstadoCronometro(estado);
        setMetaSelecionada(estado.metaSelecionada || '');
      } catch (error) {
        console.error('Erro ao carregar estado do cronômetro:', error);
      }
    }
  };

  const salvarEstado = useCallback((estado: EstadoCronometro) => {
    localStorage.setItem('cronometro_estado', JSON.stringify(estado));
  }, []);

  const iniciarCronometro = () => {
    if (!metaSelecionada) {
      toast.error('Selecione uma meta para começar');
      return;
    }

    const novoEstado: EstadoCronometro = {
      ...estadoCronometro,
      status: 'rodando',
      metaSelecionada,
      iniciadoEm: new Date()
    };

    setEstadoCronometro(novoEstado);
    salvarEstado(novoEstado);

    const id = setInterval(() => {
      setEstadoCronometro(prev => {
        const novoEstado = {
          ...prev,
          tempoDecorrido: prev.tempoDecorrido + 1
        };
        salvarEstado(novoEstado);
        return novoEstado;
      });
    }, 1000);

    setIntervalId(id);
    toast.success('Cronômetro iniciado!');
  };

  const pausarCronometro = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    const novoEstado: EstadoCronometro = {
      ...estadoCronometro,
      status: 'pausado',
      pausadoEm: new Date(),
      totalPausas: estadoCronometro.totalPausas + 1
    };

    setEstadoCronometro(novoEstado);
    salvarEstado(novoEstado);
    toast.info('Cronômetro pausado');
  };

  const retomarCronometro = () => {
    const novoEstado: EstadoCronometro = {
      ...estadoCronometro,
      status: 'rodando',
      iniciadoEm: new Date()
    };

    setEstadoCronometro(novoEstado);
    salvarEstado(novoEstado);

    const id = setInterval(() => {
      setEstadoCronometro(prev => {
        const novoEstado = {
          ...prev,
          tempoDecorrido: prev.tempoDecorrido + 1
        };
        salvarEstado(novoEstado);
        return novoEstado;
      });
    }, 1000);

    setIntervalId(id);
    toast.success('Cronômetro retomado!');
  };

  const pararCronometro = async () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    // Salvar sessão se houver tempo registrado
    if (estadoCronometro.tempoDecorrido > 0 && estadoCronometro.metaSelecionada) {
      try {
        const meta = metas.find(m => m.id === estadoCronometro.metaSelecionada);
        
         DataManager.criarSessao({
          metaId: estadoCronometro.metaSelecionada,
          duracao: estadoCronometro.tempoDecorrido / 60, // converter para minutos com precisão decimal
          data: new Date(),
          dataInicio: estadoCronometro.iniciadoEm || new Date(),
          dataFim: new Date(),
          tipo: 'cronometro',
          observacoes: observacoes.trim() || undefined,
          pausas: estadoCronometro.totalPausas
        });

        // Verificar novas conquistas
        const novasConquistas = DataManager.verificarNovasConquistas();
        if (novasConquistas.length > 0) {
          novasConquistas.forEach(conquista => {
            const conquistaInfo = DataManager.obterConquistaPorId(conquista.conquistaId);
            if (conquistaInfo) {
              toast.success(`🏆 Nova conquista: ${conquistaInfo.titulo}!`);
            }
          });
        }

         toast.success(`Sessão salva! ${formatarTempoPreciso(estadoCronometro.tempoDecorrido)} registrados para ${meta?.titulo}`);
      } catch (error) {
        toast.error('Erro ao salvar sessão');
        console.error(error);
      }
    }

    // Reset cronômetro
    const novoEstado: EstadoCronometro = {
      status: 'parado',
      tempoDecorrido: 0,
      totalPausas: 0
    };

    setEstadoCronometro(novoEstado);
    setObservacoes('');
    localStorage.removeItem('cronometro_estado');
    
    toast.info('Cronômetro parado');
  };

  const resetarCronometro = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    const novoEstado: EstadoCronometro = {
      status: 'parado',
      tempoDecorrido: 0,
      totalPausas: 0
    };

    setEstadoCronometro(novoEstado);
    setObservacoes('');
    localStorage.removeItem('cronometro_estado');
    
    toast.info('Cronômetro resetado');
  };

  // Cleanup ao sair da página
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  if (!usuario) {
    return null;
  }

  const formatarTempo = (segundos: number): string => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  const metaAtual = metas.find(m => m.id === metaSelecionada);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />
      
      <main className="flex-1 lg:ml-80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              ⏱️ Cronômetro
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Conte o tempo em tempo real
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cronômetro Principal */}
            <div className="lg:col-span-2">
              <Card className="text-center">
                <CardContent className="p-8">
                  {/* Display do Tempo */}
                  <div className="mb-8">
                    <div className="text-6xl md:text-7xl font-bold font-mono text-slate-900 dark:text-white mb-4">
                      {formatarTempo(estadoCronometro.tempoDecorrido)}
                    </div>
                    
                    {metaAtual && (
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: metaAtual.cor }}
                        />
                        <span className="text-lg font-medium text-slate-700 dark:text-slate-300">
                          {metaAtual.titulo}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-center gap-4 text-sm text-slate-500">
                      {estadoCronometro.totalPausas > 0 && (
                        <span>⏸️ {estadoCronometro.totalPausas} pausas</span>
                      )}
                       {estadoCronometro.tempoDecorrido > 0 && (
                        <span>📊 {formatarTempoPreciso(estadoCronometro.tempoDecorrido)}</span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-6">
                    <Badge 
                      variant={
                        estadoCronometro.status === 'rodando' ? 'default' :
                        estadoCronometro.status === 'pausado' ? 'secondary' : 'outline'
                      }
                      className={`text-lg px-4 py-2 ${
                        estadoCronometro.status === 'rodando' ? 'bg-green-500' :
                        estadoCronometro.status === 'pausado' ? 'bg-yellow-500' : ''
                      }`}
                    >
                      {estadoCronometro.status === 'rodando' && '▶️ Rodando'}
                      {estadoCronometro.status === 'pausado' && '⏸️ Pausado'}
                      {estadoCronometro.status === 'parado' && '⏹️ Parado'}
                    </Badge>
                  </div>

                  {/* Controles */}
                  <div className="flex justify-center gap-3">
                    {estadoCronometro.status === 'parado' && (
                      <Button
                        onClick={iniciarCronometro}
                        disabled={!metaSelecionada}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white px-8"
                      >
                        ▶️ Iniciar
                      </Button>
                    )}

                    {estadoCronometro.status === 'rodando' && (
                      <Button
                        onClick={pausarCronometro}
                        size="lg"
                        variant="outline"
                        className="px-8"
                      >
                        ⏸️ Pausar
                      </Button>
                    )}

                    {estadoCronometro.status === 'pausado' && (
                      <Button
                        onClick={retomarCronometro}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white px-8"
                      >
                        ▶️ Retomar
                      </Button>
                    )}

                    {estadoCronometro.status !== 'parado' && (
                      <>
                        <Button
                          onClick={pararCronometro}
                          size="lg"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                        >
                          ⏹️ Parar & Salvar
                        </Button>
                        
                        <Button
                          onClick={resetarCronometro}
                          size="lg"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          🔄 Reset
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configurações */}
            <div className="space-y-6">
              {/* Selecionar Meta */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configurações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta">Meta *</Label>
                    <Select 
                      value={metaSelecionada} 
                      onValueChange={setMetaSelecionada}
                      disabled={estadoCronometro.status === 'rodando'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma meta" />
                      </SelectTrigger>
                      <SelectContent>
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
                    
                    {metas.length === 0 && (
                      <p className="text-sm text-red-600">
                        Nenhuma meta ativa encontrada. 
                        <Button
                          variant="link"
                          className="p-0 ml-1 text-red-600"
                          onClick={() => router.push('/metas/nova')}
                        >
                          Criar meta
                        </Button>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações (opcional)</Label>
                    <Textarea
                      id="observacoes"
                      placeholder="Adicione notas sobre esta sessão..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-slate-500">
                      {observacoes.length}/500 caracteres
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Progresso da Meta */}
              {metaAtual && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Progresso da Meta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{formatarDuracao(Math.round(metaAtual.horasRegistradas * 60))} / {formatarDuracao(Math.round(metaAtual.horasObjetivo * 60))}</span>
                      </div>
                      
                      <Progress 
                        value={calcularProgresso(metaAtual.horasRegistradas, metaAtual.horasObjetivo)}
                        className="h-3"
                      />
                      
                      <div className="text-center">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          {calcularProgresso(metaAtual.horasRegistradas, metaAtual.horasObjetivo).toFixed(1)}%
                        </span>
                        <p className="text-xs text-slate-500">concluído</p>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          <strong>{metaAtual.categoria}</strong>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {metaAtual.descricao}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sessão Atual */}
              {estadoCronometro.tempoDecorrido > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sessão Atual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                       <div className="flex justify-between">
                        <span>Tempo decorrido:</span>
                        <span className="font-mono font-bold">
                          {formatarTempoPreciso(estadoCronometro.tempoDecorrido)}
                        </span>
                      </div>
                      
                      {estadoCronometro.iniciadoEm && (
                        <div className="flex justify-between">
                          <span>Iniciado em:</span>
                          <span>
                            {new Date(estadoCronometro.iniciadoEm).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                      )}
                      
                      {estadoCronometro.totalPausas > 0 && (
                        <div className="flex justify-between">
                          <span>Pausas:</span>
                          <span>{estadoCronometro.totalPausas}x</span>
                        </div>
                      )}
                      
                      <div className="pt-2 border-t">
                        <p className="text-xs text-slate-500">
                          Esta sessão será salva automaticamente quando você parar o cronômetro
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}