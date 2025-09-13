'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/layout/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DataManager } from '@/lib/data-manager';
import { exportData, importData } from '@/lib/storage';
import { formatarHoras, formatarData } from '@/lib/calculations';
import { useApp } from '@/components/providers/app-provider';
import { Usuario } from '@/types';
import { toast } from 'sonner';

export default function PerfilPage() {
  const { usuario, atualizarUsuario, logout } = useApp();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [dadosFormulario, setDadosFormulario] = useState({
    nome: '',
    email: '',
    configuracoes: {
      notificacoes: true,
      metaHorasDiaria: 2,
      tema: 'system' as 'light' | 'dark' | 'system'
    }
  });

  const [estatisticasGerais, setEstatisticasGerais] = useState({
    horasTotal: 0,
    totalMetas: 0,
    conquistasDesbloqueadas: 0,
    diasAtivos: 0
  });

  useEffect(() => {
    if (!usuario) {
      router.push('/auth');
      return;
    }
    
    setDadosFormulario({
      nome: usuario.nome,
      email: usuario.email,
      configuracoes: usuario.configuracoes
    });

    carregarEstatisticas();
  }, [usuario, router]);

  const carregarEstatisticas = () => {
    const estatisticas = DataManager.obterEstatisticasGerais();
    const conquistasUsuario = DataManager.obterConquistasUsuario();
    const sessoes = DataManager.obterSessoes();
    
    const diasUnicos = new Set(
      sessoes.map(s => new Date(s.data).toDateString())
    );
    
    setEstatisticasGerais({
      horasTotal: estatisticas.horasTotal,
      totalMetas: estatisticas.totalMetas,
      conquistasDesbloqueadas: conquistasUsuario.length,
      diasAtivos: diasUnicos.size
    });
  };

  const salvarPerfil = async () => {
    if (!usuario) return;

    if (!dadosFormulario.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!dadosFormulario.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    setIsLoading(true);
    
    try {
      const usuarioAtualizado: Partial<Usuario> = {
        nome: dadosFormulario.nome.trim(),
        email: dadosFormulario.email.trim(),
        configuracoes: dadosFormulario.configuracoes
      };

      atualizarUsuario(usuarioAtualizado);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportarDados = () => {
    try {
      const dadosExportados = exportData();
      
      // Criar arquivo para download
      const blob = new Blob([dadosExportados], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `10000horas-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
      console.error(error);
    }
  };

  const importarDados = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const conteudo = e.target?.result as string;
        const sucesso = importData(conteudo);
        
        if (sucesso) {
          toast.success('Dados importados com sucesso! Recarregando página...');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          toast.error('Erro ao importar dados. Verifique o arquivo.');
        }
      } catch (error) {
        toast.error('Erro ao processar arquivo');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const limparTodosDados = async () => {
    try {
      localStorage.clear();
      toast.success('Dados limpos com sucesso!');
      logout();
      router.push('/auth');
    } catch (error) {
      toast.error('Erro ao limpar dados');
      console.error(error);
    }
  };

  if (!usuario) {
    return null;
  }

  const iniciais = usuario.nome
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />
      
      <main className="flex-1 lg:ml-80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              ⚙️ Perfil & Configurações
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gerencie suas informações pessoais e preferências
            </p>
          </div>

          <Tabs defaultValue="perfil" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
              <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
              <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
              <TabsTrigger value="dados">Dados</TabsTrigger>
            </TabsList>

            {/* Aba Perfil */}
            <TabsContent value="perfil">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar e Info Básica */}
                  <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20">
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {iniciais}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {usuario.nome}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400">
                        Membro desde {formatarData(new Date(usuario.dataCadastro))}
                      </p>
                      
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">
                          🎯 {estatisticasGerais.totalMetas} metas
                        </Badge>
                        <Badge variant="outline">
                          🏆 {estatisticasGerais.conquistasDesbloqueadas} conquistas
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Formulário */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        value={dadosFormulario.nome}
                        onChange={(e) => setDadosFormulario(prev => ({
                          ...prev,
                          nome: e.target.value
                        }))}
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={dadosFormulario.email}
                        onChange={(e) => setDadosFormulario(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={salvarPerfil}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Configurações */}
            <TabsContent value="configuracoes">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Notificações */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        Notificações
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Receber notificações de conquistas e lembretes
                      </p>
                    </div>
                    <Switch
                      checked={dadosFormulario.configuracoes.notificacoes}
                      onCheckedChange={(checked) => setDadosFormulario(prev => ({
                        ...prev,
                        configuracoes: {
                          ...prev.configuracoes,
                          notificacoes: checked
                        }
                      }))}
                    />
                  </div>

                  {/* Meta diária */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        Meta de Horas Diárias
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Quantas horas você pretende praticar por dia
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="0.5"
                        max="24"
                        step="0.5"
                        value={dadosFormulario.configuracoes.metaHorasDiaria}
                        onChange={(e) => setDadosFormulario(prev => ({
                          ...prev,
                          configuracoes: {
                            ...prev.configuracoes,
                            metaHorasDiaria: parseFloat(e.target.value) || 2
                          }
                        }))}
                        className="w-24"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        horas por dia
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 4].map(horas => (
                        <Button
                          key={horas}
                          variant="outline"
                          size="sm"
                          onClick={() => setDadosFormulario(prev => ({
                            ...prev,
                            configuracoes: {
                              ...prev.configuracoes,
                              metaHorasDiaria: horas
                            }
                          }))}
                          className={dadosFormulario.configuracoes.metaHorasDiaria === horas ? 'bg-blue-50 border-blue-300' : ''}
                        >
                          {horas}h
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={salvarPerfil}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      {isLoading ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Estatísticas */}
            <TabsContent value="estatisticas">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo Geral</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total de horas:</span>
                      <span className="font-bold">{formatarHoras(estatisticasGerais.horasTotal)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Metas criadas:</span>
                      <span className="font-bold">{estatisticasGerais.totalMetas}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Conquistas desbloqueadas:</span>
                      <span className="font-bold">{estatisticasGerais.conquistasDesbloqueadas}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Dias ativos:</span>
                      <span className="font-bold">{estatisticasGerais.diasAtivos}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Progresso Rumo à Maestria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-4xl font-bold text-blue-600">
                        {((estatisticasGerais.horasTotal / 10000) * 100).toFixed(1)}%
                      </div>
                      
                      <div className="space-y-2">
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (estatisticasGerais.horasTotal / 10000) * 100)}%` }}
                          />
                        </div>
                        <p className="text-sm text-slate-500">
                          {formatarHoras(Math.max(0, 10000 - estatisticasGerais.horasTotal))} restantes para 10.000 horas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba Dados */}
            <TabsContent value="dados">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Backup & Restauração</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Exportar Dados</h4>
                      <p className="text-sm text-slate-500 mb-3">
                        Faça backup de todas as suas metas, sessões e conquistas
                      </p>
                      <Button onClick={exportarDados} variant="outline">
                        📥 Exportar Dados
                      </Button>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Importar Dados</h4>
                      <p className="text-sm text-slate-500 mb-3">
                        Restaure seus dados de um arquivo de backup
                      </p>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importarDados}
                        style={{ display: 'none' }}
                        id="import-file"
                      />
                      <Button 
                        onClick={() => document.getElementById('import-file')?.click()}
                        variant="outline"
                      >
                        📤 Importar Dados
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h4 className="font-medium mb-2 text-red-700">Limpar Todos os Dados</h4>
                      <p className="text-sm text-slate-500 mb-4">
                        ⚠️ Esta ação não pode ser desfeita. Todos os seus dados serão perdidos permanentemente.
                      </p>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            🗑️ Limpar Todos os Dados
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação irá excluir permanentemente todos os seus dados:
                              metas, sessões, conquistas e configurações.
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={limparTodosDados}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Sim, limpar tudo
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}