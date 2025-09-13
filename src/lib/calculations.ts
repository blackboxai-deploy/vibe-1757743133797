import { Meta, Sessao, EstatisticaDia, EstatisticaSemana, EstatisticaMes } from '@/types';

// Converter minutos para formato legível
export const formatarDuracao = (minutos: number): string => {
  const horas = Math.floor(minutos / 60);
  const mins = Math.round(minutos % 60);
  
  if (horas === 0) {
    return `${mins}min`;
  } else if (mins === 0) {
    return `${horas}h`;
  } else {
    return `${horas}h ${mins}min`;
  }
};

// Converter segundos para formato legível com precisão
export const formatarTempoPreciso = (segundos: number): string => {
  const horas = Math.floor(segundos / 3600);
  const mins = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  
  if (horas === 0 && mins === 0) {
    return `${segs}s`;
  } else if (horas === 0) {
    return segs === 0 ? `${mins}min` : `${mins}min ${segs}s`;
  } else {
    let resultado = `${horas}h`;
    if (mins > 0) resultado += ` ${mins}min`;
    if (segs > 0) resultado += ` ${segs}s`;
    return resultado;
  }
};

// Converter horas decimais para formato legível
export const formatarHoras = (horas: number): string => {
  const horasInteiras = Math.floor(horas);
  const minutos = Math.round((horas - horasInteiras) * 60);
  
  if (horasInteiras === 0) {
    return `${minutos}min`;
  } else if (minutos === 0) {
    return `${horasInteiras}h`;
  } else {
    return `${horasInteiras}h ${minutos}min`;
  }
};

// Calcular percentual de progresso
export const calcularProgresso = (horasRegistradas: number, horasObjetivo: number): number => {
  if (horasObjetivo === 0) return 0;
  return Math.min(100, (horasRegistradas / horasObjetivo) * 100);
};

// Calcular tempo restante para meta
export const calcularTempoRestante = (horasRegistradas: number, horasObjetivo: number): number => {
  return Math.max(0, horasObjetivo - horasRegistradas);
};

// Calcular projeção de conclusão baseada na média
export const calcularProjecao = (meta: Meta, sessoes: Sessao[]): Date | null => {
  const sessoesMetaUltimos30Dias = sessoes
    .filter(s => s.metaId === meta.id)
    .filter(s => {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);
      return new Date(s.data) >= dataLimite;
    });

  if (sessoesMetaUltimos30Dias.length === 0) return null;

  const horasPorDia = sessoesMetaUltimos30Dias.reduce((total, s) => total + (s.duracao / 60), 0) / 30;
  const horasRestantes = calcularTempoRestante(meta.horasRegistradas, meta.horasObjetivo);
  
  if (horasPorDia <= 0) return null;

  const diasRestantes = Math.ceil(horasRestantes / horasPorDia);
  const dataProjecao = new Date();
  dataProjecao.setDate(dataProjecao.getDate() + diasRestantes);
  
  return dataProjecao;
};

// Calcular estatísticas diárias
export const calcularEstatisticasDiarias = (sessoes: Sessao[], dias = 30): EstatisticaDia[] => {
  const hoje = new Date();
  const estatisticas: EstatisticaDia[] = [];
  
  for (let i = dias - 1; i >= 0; i--) {
    const data = new Date(hoje);
    data.setDate(data.getDate() - i);
    data.setHours(0, 0, 0, 0);
    
    const sessoesDia = sessoes.filter(s => {
      const dataSessao = new Date(s.data);
      dataSessao.setHours(0, 0, 0, 0);
      return dataSessao.getTime() === data.getTime();
    });
    
    const horasTotal = sessoesDia.reduce((total, s) => total + (s.duracao / 60), 0);
    const metasAtivas = new Set(sessoesDia.map(s => s.metaId)).size;
    
    estatisticas.push({
      data,
      horasTotal,
      sessoesTotal: sessoesDia.length,
      metasAtivas
    });
  }
  
  return estatisticas;
};

// Calcular estatísticas semanais
export const calcularEstatisticasSemanais = (sessoes: Sessao[], semanas = 12): EstatisticaSemana[] => {
  const estatisticas: EstatisticaSemana[] = [];
  
  for (let i = semanas - 1; i >= 0; i--) {
    const fimSemana = new Date();
    fimSemana.setDate(fimSemana.getDate() - (i * 7));
    fimSemana.setHours(23, 59, 59, 999);
    
    const inicioSemana = new Date(fimSemana);
    inicioSemana.setDate(inicioSemana.getDate() - 6);
    inicioSemana.setHours(0, 0, 0, 0);
    
    const sessoesSemana = sessoes.filter(s => {
      const dataSessao = new Date(s.data);
      return dataSessao >= inicioSemana && dataSessao <= fimSemana;
    });
    
    const horasTotal = sessoesSemana.reduce((total, s) => total + (s.duracao / 60), 0);
    const diasComSessao = new Set(
      sessoesSemana.map(s => new Date(s.data).toDateString())
    ).size;
    
    estatisticas.push({
      inicioSemana,
      fimSemana,
      horasTotal,
      sessoesTotal: sessoesSemana.length,
      diasAtivos: diasComSessao,
      mediaHorasPorDia: diasComSessao > 0 ? horasTotal / diasComSessao : 0
    });
  }
  
  return estatisticas;
};

// Calcular estatísticas mensais
export const calcularEstatisticasMensais = (sessoes: Sessao[], conquistas: any[], meses = 12): EstatisticaMes[] => {
  const estatisticas: EstatisticaMes[] = [];
  
  for (let i = meses - 1; i >= 0; i--) {
    const data = new Date();
    data.setMonth(data.getMonth() - i);
    const mes = data.getMonth();
    const ano = data.getFullYear();
    
    const sessoesMes = sessoes.filter(s => {
      const dataSessao = new Date(s.data);
      return dataSessao.getMonth() === mes && dataSessao.getFullYear() === ano;
    });
    
    const conquistasMes = conquistas.filter(c => {
      const dataConquista = new Date(c.dataDesbloqueio);
      return dataConquista.getMonth() === mes && dataConquista.getFullYear() === ano;
    });
    
    const horasTotal = sessoesMes.reduce((total, s) => total + (s.duracao / 60), 0);
    const diasAtivos = new Set(
      sessoesMes.map(s => new Date(s.data).toDateString())
    ).size;
    
    estatisticas.push({
      mes,
      ano,
      horasTotal,
      sessoesTotal: sessoesMes.length,
      diasAtivos,
      conquistasDesbloqueadas: conquistasMes.length
    });
  }
  
  return estatisticas;
};

// Calcular sequência de dias consecutivos
export const calcularSequenciaConsecutiva = (sessoes: Sessao[]): number => {
  if (sessoes.length === 0) return 0;
  
  const diasComSessao = new Set(
    sessoes.map(s => new Date(s.data).toDateString())
  );
  
  let sequencia = 0;
  const hoje = new Date();
  
  // Verificar sequência atual (começando de hoje)
  for (let i = 0; i < 365; i++) { // Máximo 1 ano
    const data = new Date(hoje);
    data.setDate(data.getDate() - i);
    
    if (diasComSessao.has(data.toDateString())) {
      sequencia++;
    } else {
      break;
    }
  }
  
  return sequencia;
};

// Calcular maior sequência de todos os tempos
export const calcularMaiorSequencia = (sessoes: Sessao[]): number => {
  if (sessoes.length === 0) return 0;
  
  const diasComSessao = Array.from(
    new Set(sessoes.map(s => new Date(s.data).toDateString()))
  ).map(dateString => new Date(dateString))
  .sort((a, b) => a.getTime() - b.getTime());
  
  let maiorSequencia = 0;
  let sequenciaAtual = 1;
  
  for (let i = 1; i < diasComSessao.length; i++) {
    const diaAnterior = new Date(diasComSessao[i - 1]);
    const diaAtual = new Date(diasComSessao[i]);
    
    diaAnterior.setDate(diaAnterior.getDate() + 1);
    
    if (diaAnterior.toDateString() === diaAtual.toDateString()) {
      sequenciaAtual++;
    } else {
      maiorSequencia = Math.max(maiorSequencia, sequenciaAtual);
      sequenciaAtual = 1;
    }
  }
  
  return Math.max(maiorSequencia, sequenciaAtual);
};

// Calcular velocidade de progresso (horas por semana)
export const calcularVelocidadeProgresso = (sessoes: Sessao[], meta: Meta): number => {
  const sessoesUltimas4Semanas = sessoes
    .filter(s => s.metaId === meta.id)
    .filter(s => {
      const quatroSemanasAtras = new Date();
      quatroSemanasAtras.setDate(quatroSemanasAtras.getDate() - 28);
      return new Date(s.data) >= quatroSemanasAtras;
    });
  
  const horasUltimas4Semanas = sessoesUltimas4Semanas.reduce(
    (total, s) => total + (s.duracao / 60), 
    0
  );
  
  return horasUltimas4Semanas / 4; // Média por semana
};

// Calcular ranking de metas por horas
export const calcularRankingMetas = (metas: Meta[]): Meta[] => {
  return [...metas].sort((a, b) => b.horasRegistradas - a.horasRegistradas);
};

// Calcular eficiência (progresso vs tempo desde criação)
export const calcularEficiencia = (meta: Meta): number => {
  const agora = new Date().getTime();
  const criacao = new Date(meta.dataCriacao).getTime();
  const diasDesdeCriacao = (agora - criacao) / (1000 * 60 * 60 * 24);
  
  if (diasDesdeCriacao <= 0) return 0;
  
  const horasPorDia = meta.horasRegistradas / diasDesdeCriacao;
  const horasNecessariasPorDia = meta.horasObjetivo / (365 * 10); // 10 anos para completar 10k horas
  
  return (horasPorDia / horasNecessariasPorDia) * 100;
};

// Gerar insights automáticos
export const gerarInsights = (metas: Meta[], sessoes: Sessao[]): string[] => {
  const insights: string[] = [];
  
  // Insight sobre consistência
  const sequencia = calcularSequenciaConsecutiva(sessoes);
  if (sequencia >= 7) {
    insights.push(`🔥 Incrível! Você está praticando por ${sequencia} dias consecutivos!`);
  } else if (sequencia >= 3) {
    insights.push(`💪 Boa! ${sequencia} dias consecutivos de prática. Continue assim!`);
  }
  
  // Insight sobre progresso da semana
  const estatisticasSemanais = calcularEstatisticasSemanais(sessoes, 2);
  if (estatisticasSemanais.length >= 2) {
    const semanaAtual = estatisticasSemanais[1];
    const semanaAnterior = estatisticasSemanais[0];
    
    const diferenca = semanaAtual.horasTotal - semanaAnterior.horasTotal;
    if (diferenca > 0) {
      insights.push(`📈 Você praticou ${formatarHoras(diferenca)} a mais esta semana!`);
    }
  }
  
  // Insight sobre meta com maior progresso
  const metaComMaiorProgresso = metas
    .filter(m => m.ativa && m.horasRegistradas > 0)
    .sort((a, b) => calcularProgresso(b.horasRegistradas, b.horasObjetivo) - calcularProgresso(a.horasRegistradas, a.horasObjetivo))[0];
  
  if (metaComMaiorProgresso) {
    const progresso = calcularProgresso(metaComMaiorProgresso.horasRegistradas, metaComMaiorProgresso.horasObjetivo);
    if (progresso >= 25) {
      insights.push(`🎯 ${metaComMaiorProgresso.titulo} já está ${progresso.toFixed(1)}% concluída!`);
    }
  }
  
  // Insight sobre total de horas
  const horasTotal = sessoes.reduce((total, s) => total + (s.duracao / 60), 0);
  if (horasTotal >= 100) {
    insights.push(`🏆 Parabéns! Você já acumulou ${formatarHoras(horasTotal)} de prática!`);
  }
  
  return insights;
};

// Utilitários de data
export const formatarData = (data: Date): string => {
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatarDataHora = (data: Date): string => {
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const obterNomeDiaSemana = (data: Date): string => {
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return dias[data.getDay()];
};

export const obterNomeMes = (mes: number): string => {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return meses[mes];
};