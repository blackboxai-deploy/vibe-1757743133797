'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/layout/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DataManager } from '@/lib/data-manager';
import { formatarHoras, calcularProgresso } from '@/lib/calculations';
import { useApp } from '@/components/providers/app-provider';
import { Meta, CategoriasMeta } from '@/types';
import { toast } from 'sonner';

export default function MetasPage() {
  const { usuario } = useApp();
  const router = useRouter();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (!usuario) {
      router.push('/auth');
      return;
    }
    carregarMetas();
  }, [usuario, router]);

  const carregarMetas = () => {
    const metasCarregadas = DataManager.obterMetas();
    setMetas(metasCarregadas);
  };

  const metasFiltradas = metas.filter(meta => {
    // Filtro por busca
    const matchBusca = meta.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                      meta.descricao.toLowerCase().includes(busca.toLowerCase());

    // Filtro por categoria
    const matchCategoria = filtroCategoria === 'todas' || meta.categoria === filtroCategoria;

    // Filtro por status
    let matchStatus = true;
    if (filtroStatus === 'ativas') {
      matchStatus = meta.ativa;
    } else if (filtroStatus === 'inativas') {
      matchStatus = !meta.ativa;
    } else if (filtroStatus === 'concluidas') {
      matchStatus = calcularProgresso(meta.horasRegistradas, meta.horasObjetivo) >= 100;
    } else if (filtroStatus === 'em-progresso') {
      matchStatus = meta.ativa && calcularProgresso(meta.horasRegistradas, meta.horasObjetivo) < 100;
    }

    return matchBusca && matchCategoria && matchStatus;
  });

  const toggleStatusMeta = async (metaId: string) => {
    try {
      const meta = metas.find(m => m.id === metaId);
      if (!meta) return;

      DataManager.atualizarMeta(metaId, { ativa: !meta.ativa });
      carregarMetas();
      
      toast.success(`Meta ${!meta.ativa ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (error) {
      toast.error('Erro ao atualizar meta');
      console.error(error);
    }
  };

  const excluirMeta = async (metaId: string) => {
    try {
      DataManager.excluirMeta(metaId);
      carregarMetas();
      toast.success('Meta excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir meta');
      console.error(error);
    }
  };

  if (!usuario) {
    return null;
  }

  const estatisticas = {
    total: metas.length,
    ativas: metas.filter(m => m.ativa).length,
    concluidas: metas.filter(m => calcularProgresso(m.horasRegistradas, m.horasObjetivo) >= 100).length,
    horasTotal: metas.reduce((total, m) => total + m.horasRegistradas, 0)
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />
      
      <main className="flex-1 lg:ml-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  🎯 Suas Metas
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Gerencie suas metas de especialização
                </p>
              </div>
              <Button 
                onClick={() => router.push('/metas/nova')}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Nova Meta
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {estatisticas.total}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Total de Metas
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {estatisticas.ativas}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Ativas
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {estatisticas.concluidas}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Concluídas
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatarHoras(estatisticas.horasTotal)}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Horas Total
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Input
                    placeholder="Buscar metas..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as categorias</SelectItem>
                      {Object.values(CategoriasMeta).map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todos os status</SelectItem>
                      <SelectItem value="ativas">Ativas</SelectItem>
                      <SelectItem value="inativas">Inativas</SelectItem>
                      <SelectItem value="em-progresso">Em progresso</SelectItem>
                      <SelectItem value="concluidas">Concluídas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setBusca('');
                      setFiltroCategoria('todas');
                      setFiltroStatus('todas');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Metas */}
          <div className="space-y-4">
            {metasFiltradas.length > 0 ? (
              metasFiltradas.map((meta) => {
                const progresso = calcularProgresso(meta.horasRegistradas, meta.horasObjetivo);
                const isConcluida = progresso >= 100;
                const isQuaseConcluida = progresso >= 75;

                return (
                  <Card 
                    key={meta.id}
                    className={`transition-all duration-200 hover:shadow-md ${
                      !meta.ativa ? 'opacity-60' : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Informações da Meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: meta.cor }}
                            />
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white truncate">
                              {meta.titulo}
                            </h3>
                            
                            <div className="flex gap-2">
                              {isConcluida && (
                                <Badge className="bg-green-600 text-white">
                                  Concluída 🎉
                                </Badge>
                              )}
                              {isQuaseConcluida && !isConcluida && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  Quase lá!
                                </Badge>
                              )}
                              {!meta.ativa && (
                                <Badge variant="outline">
                                  Inativa
                                </Badge>
                              )}
                              <Badge variant="outline">
                                {meta.categoria}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                            {meta.descricao}
                          </p>
                          
                          {/* Progresso */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">Progresso</span>
                              <span className="font-medium">
                                {formatarHoras(meta.horasRegistradas)} / {formatarHoras(meta.horasObjetivo)}
                              </span>
                            </div>
                            <Progress value={progresso} className="h-2" />
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>{progresso.toFixed(1)}% concluído</span>
                              <span>
                                {isConcluida 
                                  ? 'Meta alcançada!' 
                                  : `${formatarHoras(meta.horasObjetivo - meta.horasRegistradas)} restantes`
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/metas/${meta.id}/editar`)}
                          >
                            Editar
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatusMeta(meta.id)}
                            className={meta.ativa ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                          >
                            {meta.ativa ? 'Desativar' : 'Ativar'}
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
                                <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Todas as sessões relacionadas a esta meta também serão excluídas.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => excluirMeta(meta.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  {metas.length === 0 ? (
                    <>
                      <div className="text-4xl mb-4">🎯</div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                        Nenhuma meta criada ainda
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Crie sua primeira meta de especialização
                      </p>
                      <Button 
                        onClick={() => router.push('/metas/nova')}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      >
                        Criar Primeira Meta
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl mb-4">🔍</div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                        Nenhuma meta encontrada
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Tente ajustar os filtros ou criar uma nova meta
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setBusca('');
                            setFiltroCategoria('todas');
                            setFiltroStatus('todas');
                          }}
                        >
                          Limpar Filtros
                        </Button>
                        <Button 
                          onClick={() => router.push('/metas/nova')}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                          Nova Meta
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}