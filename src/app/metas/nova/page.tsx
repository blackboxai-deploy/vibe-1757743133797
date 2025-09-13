'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/layout/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataManager } from '@/lib/data-manager';
import { useApp } from '@/components/providers/app-provider';
import { CategoriasMeta } from '@/types';
import { toast } from 'sonner';

const coresPredefinidas = [
  '#3B82F6', // blue-500
  '#8B5CF6', // purple-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#EC4899', // pink-500
  '#6366F1', // indigo-500
];

export default function NovaMetaPage() {
  const { usuario } = useApp();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    horasObjetivo: 10000,
    cor: coresPredefinidas[0]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    } else if (formData.titulo.length > 100) {
      newErrors.titulo = 'Título deve ter no máximo 100 caracteres';
    }

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    } else if (formData.descricao.length > 500) {
      newErrors.descricao = 'Descrição deve ter no máximo 500 caracteres';
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Categoria é obrigatória';
    }

    if (formData.horasObjetivo < 1) {
      newErrors.horasObjetivo = 'Meta deve ter pelo menos 1 hora';
    } else if (formData.horasObjetivo > 50000) {
      newErrors.horasObjetivo = 'Meta não pode exceder 50.000 horas';
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
      DataManager.criarMeta({
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        categoria: formData.categoria,
        horasObjetivo: formData.horasObjetivo,
        cor: formData.cor,
        ativa: true
      });

      toast.success('Meta criada com sucesso!');
      router.push('/metas');
    } catch (error) {
      toast.error('Erro ao criar meta');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              ← Voltar
            </Button>
            
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              🎯 Nova Meta
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Crie uma nova meta de especialização
            </p>
          </div>

          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Meta</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Título */}
                <div className="space-y-2">
                  <Label htmlFor="titulo">
                    Título da Meta *
                  </Label>
                  <Input
                    id="titulo"
                    type="text"
                    placeholder="Ex: Tocar violão, Programação Python, Inglês fluente..."
                    value={formData.titulo}
                    onChange={(e) => updateField('titulo', e.target.value)}
                    className={errors.titulo ? 'border-red-500' : ''}
                    maxLength={100}
                  />
                  {errors.titulo && (
                    <p className="text-sm text-red-600">{errors.titulo}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {formData.titulo.length}/100 caracteres
                  </p>
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="descricao">
                    Descrição *
                  </Label>
                  <Textarea
                    id="descricao"
                    placeholder="Descreva sua meta em detalhes. O que você quer aprender ou melhorar?"
                    value={formData.descricao}
                    onChange={(e) => updateField('descricao', e.target.value)}
                    className={errors.descricao ? 'border-red-500' : ''}
                    rows={4}
                    maxLength={500}
                  />
                  {errors.descricao && (
                    <p className="text-sm text-red-600">{errors.descricao}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {formData.descricao.length}/500 caracteres
                  </p>
                </div>

                {/* Categoria */}
                <div className="space-y-2">
                  <Label htmlFor="categoria">
                    Categoria *
                  </Label>
                  <Select value={formData.categoria} onValueChange={(value) => updateField('categoria', value)}>
                    <SelectTrigger className={errors.categoria ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(CategoriasMeta).map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoria && (
                    <p className="text-sm text-red-600">{errors.categoria}</p>
                  )}
                </div>

                {/* Horas Objetivo */}
                <div className="space-y-2">
                  <Label htmlFor="horasObjetivo">
                    Meta de Horas *
                  </Label>
                  <Input
                    id="horasObjetivo"
                    type="number"
                    min="1"
                    max="50000"
                    value={formData.horasObjetivo}
                    onChange={(e) => updateField('horasObjetivo', parseInt(e.target.value) || 0)}
                    className={errors.horasObjetivo ? 'border-red-500' : ''}
                  />
                  {errors.horasObjetivo && (
                    <p className="text-sm text-red-600">{errors.horasObjetivo}</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {[100, 1000, 5000, 10000].map((horas) => (
                      <Button
                        key={horas}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateField('horasObjetivo', horas)}
                        className={formData.horasObjetivo === horas ? 'bg-blue-50 border-blue-300' : ''}
                      >
                        {horas.toLocaleString()}h
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Dica: 10.000 horas é considerada a meta clássica para maestria
                  </p>
                </div>

                {/* Cor */}
                <div className="space-y-2">
                  <Label htmlFor="cor">
                    Cor da Meta
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {coresPredefinidas.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.cor === cor 
                            ? 'border-slate-900 dark:border-white scale-110' 
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                        style={{ backgroundColor: cor }}
                        onClick={() => updateField('cor', cor)}
                        title={`Selecionar cor ${cor}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-800">
                  <h4 className="font-medium text-sm text-slate-900 dark:text-white mb-3">
                    Preview da Meta:
                  </h4>
                  <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: formData.cor }}
                      />
                      <h5 className="font-semibold text-slate-900 dark:text-white">
                        {formData.titulo || 'Título da meta'}
                      </h5>
                      {formData.categoria && (
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {formData.categoria}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {formData.descricao || 'Descrição da meta'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Meta: {formData.horasObjetivo.toLocaleString()} horas
                    </p>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
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
                    {isLoading ? 'Criando...' : 'Criar Meta'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}