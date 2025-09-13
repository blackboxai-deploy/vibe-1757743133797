'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navigation } from '@/components/layout/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { DataManager } from '@/lib/data-manager';
import { formatarTempoPreciso, formatarData } from '@/lib/calculations';
import { useApp } from '@/components/providers/app-provider';
import { Meta, Sessao } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EditarSessaoPage() {
  const { usuario } = useApp();
  const router = useRouter();
  const params = useParams();
  const sessaoId = params.id as string;
  
  const [metas, setMetas] = useState<Meta[]>([]);
  const [sessaoOriginal, setSessaoOriginal] = useState<Sessao | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    metaId: '',
    data: new Date(),
    horas: 0,
    minutos: 0,
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
    carregarDados();
  }, [usuario, router, sessaoId]);

  const carregarDados = () => {
    const todasMetas = DataManager.obterMetas();
    setMetas(todasMetas);

    const sessao = DataManager.obterSessaoPorId(sessaoId);
    if (!sessao) {
      toast.error('Sessão não encontrada');
      router.push('/historico');
      return;
    }

    setSessaoOriginal(sessao);
    
    // Converter duração de minutos para horas, minutos e segundos
    const totalSegundos = Math.round(sessao.duracao * 60);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    setFormData({
      metaId: sessao.metaId,
      data: new Date(sessao.data),
      horas,
      minutos,
      segundos,
      observacoes: sessao.observacoes || ''
    });
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
    
    if (!validateForm() || !sessaoOriginal) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setIsLoading(true);

    try {
      const totalSegundos = (formData.horas * 3600) + (formData.minutos * 60) + formData.segundos;
      const totalMinutos = totalSegundos / 60;
      
      // Atualizar sessão
      DataManager.atualizarSessao(sessaoId, {
        metaId: formData.metaId,
        duracao: totalMinutos,
        data: formData.data,
        dataFim: new Date(formData.data.getTime() + (totalSegundos * 1000)),
        observacoes: formData.observacoes.trim() || undefined
      });

      toast.success('Sessão atualizada com sucesso!');
      router.push('/historico');
      
    } catch (error) {
      toast.error('Erro ao atualizar sessão');
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

  if (!usuario || !sessaoOriginal) {
    return null;
  }

  const metaSelecionada = metas.find(m => m.id === formData.metaId);
  const totalSegundos = (formData.horas * 3600) + (formData.minutos * 60) + formData.segundos;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />
      
      <main className="flex-1 lg:ml-80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              ← Voltar
            </Button>
            
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              ✏️ Editar Sessão
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Modifique os dados da sua sessão de prática
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulário */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Sessão</CardTitle>
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
                                {!meta.ativa && (
                                  <span className="text-xs text-orange-600">
                                    (Inativa)
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.metaId && (
                        <p className="text-sm text-red-600">{errors.metaId}</p>
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
                              formData.horas === preset.horas && 
                              formData.minutos === preset.minutos && 
                              formData.segundos === preset.segundos
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
                          Total: {formatarTempoPreciso(totalSegundos)}
                        </p>
                      </div>
                    </div>

                    {/* Observações */}
                    <div className="space-y-2">
                      <Label htmlFor="observacoes">Observações (opcional)</Label>
                      <Textarea
                        id="observacoes"
                        placeholder="Adicione notas sobre esta sessão..."
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
                        disabled={isLoading}
                      >
                        {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar de Comparação */}
            <div className="space-y-6">
              {/* Dados Originais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dados Originais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Meta:</span>
                      <span className="font-medium">
                        {metas.find(m => m.id === sessaoOriginal.metaId)?.titulo || 'Meta removida'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Data:</span>
                      <span className="font-medium">
                        {formatarData(new Date(sessaoOriginal.data))}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Duração:</span>
                      <span className="font-medium">
                        {formatarTempoPreciso(Math.round(sessaoOriginal.duracao * 60))}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Tipo:</span>
                      <span className="font-medium">
                        {sessaoOriginal.tipo === 'cronometro' ? '⏱️ Cronômetro' : '📝 Manual'}
                      </span>
                    </div>
                    
                    {sessaoOriginal.observacoes && (
                      <div className="pt-2 border-t">
                        <p className="text-slate-600 dark:text-slate-400 mb-1">Observações:</p>
                        <p className="text-xs text-slate-500 italic">
                          "{sessaoOriginal.observacoes}"
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Preview das Alterações */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview das Alterações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Meta:</span>
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
                      <span className="text-slate-600 dark:text-slate-400">Data:</span>
                      <span className="font-medium">
                        {formatarData(formData.data)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Duração:</span>
                      <span className="font-medium">
                        {formatarTempoPreciso(totalSegundos)}
                      </span>
                    </div>
                    
                    {formData.observacoes && (
                      <div className="pt-2 border-t">
                        <p className="text-slate-600 dark:text-slate-400 mb-1">Observações:</p>
                        <p className="text-xs text-slate-500 italic">
                          "{formData.observacoes}"
                        </p>
                      </div>
                    )}

                    {/* Indicador de mudanças */}
                    <div className="pt-3 border-t">
                      <div className="space-y-1">
                        {formData.metaId !== sessaoOriginal.metaId && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            Meta alterada
                          </Badge>
                        )}
                        
                        {formData.data.toDateString() !== new Date(sessaoOriginal.data).toDateString() && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                            Data alterada
                          </Badge>
                        )}
                        
                        {totalSegundos !== Math.round(sessaoOriginal.duracao * 60) && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            Duração alterada
                          </Badge>
                        )}
                        
                        {formData.observacoes !== (sessaoOriginal.observacoes || '') && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                            Observações alteradas
                          </Badge>
                        )}
                      </div>
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