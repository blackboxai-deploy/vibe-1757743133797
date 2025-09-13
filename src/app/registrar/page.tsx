'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/layout/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DataManager } from '@/lib/data-manager';
import { formatarDuracao, formatarData, formatarTempoPreciso } from '@/lib/calculations';
import { useApp } from '@/components/providers/app-provider';
import { Meta } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RegistrarPage() {
  const { usuario } = useApp();
  const router = useRouter();
  
  const [metas, setMetas] = useState<Meta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    metaId: '',
    data: new Date(),
    horas: 0,
    minutos: 30,
    segundos: 0,
    observacoes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!usuario) {
      router.push('/auth');
      return;
    }
    carregarMetas();
  }, [usuario, router]);

  const carregarMetas = () => {
    const metasAtivas = DataManager.obterMetas(true);
    setMetas(metasAtivas);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

     if (!formData.metaId) {
      newErrors.metaId = 'Selecione uma meta';
    }

    const totalSegundos = (formData.horas * 3600) + (formData.minutos * 60) + formData.segundos;
    if (totalSegundos <= 0) {
      newErrors.tempo = 'O tempo deve ser maior que zero';
    } else if (totalSegundos > (24 * 3600)) {
      newErrors.tempo = 'O tempo não pode exceder 24 horas';
    }

    if (formData.data > new Date()) {
      newErrors.data = 'A data não pode ser no futuro';
    }

    if (formData.observacoes.length > 500) {
      newErrors.observacoes = 'Observações devem ter no máximo 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setIsLoading(true);

     try {
      const totalSegundos = (formData.horas * 3600) + (formData.minutos * 60) + formData.segundos;
      const totalMinutos = totalSegundos / 60; // Converter para minutos com precisão decimal
      const meta = metas.find(m => m.id === formData.metaId);
      
      // Criar sessão
      DataManager.criarSessao({
        metaId: formData.metaId,
        duracao: totalMinutos,
        data: formData.data,
        dataInicio: formData.data,
        dataFim: new Date(formData.data.getTime() + (totalSegundos * 1000)),
        tipo: 'manual',
        observacoes: formData.observacoes.trim() || undefined,
        pausas: 0
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

       toast.success(`Sessão registrada! ${formatarDuracao(totalMinutos)} adicionados à meta "${meta?.titulo}"`);
      
      // Reset form
      setFormData({
        metaId: '',
        data: new Date(),
        horas: 0,
        minutos: 30,
        segundos: 0,
        observacoes: ''
      });
      
    } catch (error) {
      toast.error('Erro ao registrar sessão');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

   const presets = [
    { label: '5 min', horas: 0, minutos: 5, segundos: 0 },
    { label: '15 min', horas: 0, minutos: 15, segundos: 0 },
    { label: '30 min', horas: 0, minutos: 30, segundos: 0 },
    { label: '45 min', horas: 0, minutos: 45, segundos: 0 },
    { label: '1 hora', horas: 1, minutos: 0, segundos: 0 },
    { label: '1h 30min', horas: 1, minutos: 30, segundos: 0 },
    { label: '2 horas', horas: 2, minutos: 0, segundos: 0 },
    { label: '3 horas', horas: 3, minutos: 0, segundos: 0 },
  ];

  const metaSelecionada = metas.find(m => m.id === formData.metaId);

  if (!usuario) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />
      
      <main className="flex-1 lg:ml-80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              📝 Registrar Horas
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Adicione horas de prática manualmente
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulário */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Nova Sessão</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Meta */}
                    <div className="space-y-2">
                      <Label htmlFor="meta">Meta *</Label>
                      <Select 
                        value={formData.metaId} 
                        onValueChange={(value) => updateField('metaId', value)}
                      >
                        <SelectTrigger className={errors.metaId ? 'border-red-500' : ''}>
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
                                <span>{meta.titulo}</span>
                                <span className="text-xs text-slate-500">
                                  ({meta.categoria})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.metaId && (
                        <p className="text-sm text-red-600">{errors.metaId}</p>
                      )}
                      
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

                    {/* Data */}
                    <div className="space-y-2">
                      <Label>Data da Sessão *</Label>
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${errors.data ? 'border-red-500' : ''}`}
                          >
                            <span className="mr-2">📅</span>
                            {format(formData.data, "PPP", { locale: ptBR })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.data}
                            onSelect={(data) => {
                              if (data) {
                                updateField('data', data);
                                setCalendarOpen(false);
                              }
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.data && (
                        <p className="text-sm text-red-600">{errors.data}</p>
                      )}
                    </div>

                    {/* Tempo */}
                    <div className="space-y-4">
                      <Label>Duração da Sessão *</Label>
                      
                      {/* Presets */}
                      <div className="grid grid-cols-4 gap-2">
                        {presets.map((preset) => (
                          <Button
                            key={preset.label}
                            type="button"
                            variant="outline"
                            size="sm"
                             onClick={() => {
                              updateField('horas', preset.horas);
                              updateField('minutos', preset.minutos);
                              updateField('segundos', preset.segundos);
                            }}
                            className={
                              formData.horas === preset.horas && formData.minutos === preset.minutos && formData.segundos === preset.segundos
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : ''
                            }
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>

                       {/* Inputs personalizados */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="horas">Horas</Label>
                          <Input
                            id="horas"
                            type="number"
                            min="0"
                            max="24"
                            value={formData.horas}
                            onChange={(e) => updateField('horas', parseInt(e.target.value) || 0)}
                            className={errors.tempo ? 'border-red-500' : ''}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="minutos">Minutos</Label>
                          <Input
                            id="minutos"
                            type="number"
                            min="0"
                            max="59"
                            step="1"
                            value={formData.minutos}
                            onChange={(e) => updateField('minutos', parseInt(e.target.value) || 0)}
                            className={errors.tempo ? 'border-red-500' : ''}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="segundos">Segundos</Label>
                          <Input
                            id="segundos"
                            type="number"
                            min="0"
                            max="59"
                            step="1"
                            value={formData.segundos}
                            onChange={(e) => updateField('segundos', parseInt(e.target.value) || 0)}
                            className={errors.tempo ? 'border-red-500' : ''}
                          />
                        </div>
                      </div>
                      
                      {errors.tempo && (
                        <p className="text-sm text-red-600">{errors.tempo}</p>
                      )}
                      
                       <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Total: {formatarTempoPreciso((formData.horas * 3600) + (formData.minutos * 60) + formData.segundos)}
                        </p>
                      </div>
                    </div>

                    {/* Observações */}
                    <div className="space-y-2">
                      <Label htmlFor="observacoes">Observações (opcional)</Label>
                      <Textarea
                        id="observacoes"
                        placeholder="Adicione notas sobre esta sessão... O que você praticou? Como foi?"
                        value={formData.observacoes}
                        onChange={(e) => updateField('observacoes', e.target.value)}
                        className={errors.observacoes ? 'border-red-500' : ''}
                        rows={4}
                        maxLength={500}
                      />
                      {errors.observacoes && (
                        <p className="text-sm text-red-600">{errors.observacoes}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        {formData.observacoes.length}/500 caracteres
                      </p>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        disabled={isLoading || metas.length === 0}
                      >
                        {isLoading ? 'Salvando...' : 'Registrar Sessão'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Meta:</span>
                      {metaSelecionada ? (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: metaSelecionada.cor }}
                          />
                          <span className="font-medium text-sm">
                            {metaSelecionada.titulo}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">Nenhuma meta selecionada</span>
                      )}
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Data:</span>
                      <span className="font-medium text-sm">
                        {formatarData(formData.data)}
                      </span>
                    </div>
                    
                     <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Duração:</span>
                      <span className="font-medium text-sm">
                        {formatarTempoPreciso((formData.horas * 3600) + (formData.minutos * 60) + formData.segundos)}
                      </span>
                    </div>
                    
                    {formData.observacoes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Observações:</p>
                        <p className="text-xs text-slate-500 italic">
                          "{formData.observacoes}"
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Progresso da Meta Selecionada */}
              {metaSelecionada && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Progresso da Meta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {((metaSelecionada.horasRegistradas / metaSelecionada.horasObjetivo) * 100).toFixed(1)}%
                        </div>
                        <p className="text-xs text-slate-500">concluído</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Atual</span>
                          <span>{formatarDuracao(Math.round(metaSelecionada.horasRegistradas * 60))}</span>
                        </div>
                         <div className="flex justify-between text-sm text-green-600">
                          <span>+ Esta sessão</span>
                          <span>+{formatarTempoPreciso((formData.horas * 3600) + (formData.minutos * 60) + formData.segundos)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium border-t pt-1">
                          <span>Total</span>
                          <span>
                            {formatarDuracao(
                              Math.round(metaSelecionada.horasRegistradas * 60) + 
                              ((formData.horas * 60) + formData.minutos + (formData.segundos / 60))
                            )} / {formatarDuracao(Math.round(metaSelecionada.horasObjetivo * 60))}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-500 text-center">
                        {metaSelecionada.categoria} • {metaSelecionada.descricao}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💡 Dicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Seja específico</p>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                        Adicione observações sobre o que você praticou
                      </p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Registre regularmente</p>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                        Mantenha o hábito de registrar suas sessões
                      </p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Use o cronômetro</p>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                        Para sessões em tempo real, use o cronômetro integrado
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}