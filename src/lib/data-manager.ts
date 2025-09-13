import { 
  Usuario, 
  Meta, 
  Sessao, 
  Conquista,
  ConquistaUsuario,
  FiltroSessoes,
  OrdenacaoSessoes
} from '@/types';
import { storage } from './storage';

export class DataManager {
  // USUÁRIOS
  static criarUsuario(dados: Omit<Usuario, 'id' | 'dataCadastro'>): Usuario {
    const usuario: Usuario = {
      id: crypto.randomUUID(),
      dataCadastro: new Date(),
      ...dados
    };
    
    storage.set('usuario_atual', usuario);
    return usuario;
  }

  static obterUsuarioAtual(): Usuario | null {
    return storage.get<Usuario>('usuario_atual');
  }

  static atualizarUsuario(dadosAtualizados: Partial<Usuario>): void {
    const usuario = this.obterUsuarioAtual();
    if (usuario) {
      const usuarioAtualizado = { ...usuario, ...dadosAtualizados };
      storage.set('usuario_atual', usuarioAtualizado);
    }
  }

  // METAS
  static criarMeta(dados: Omit<Meta, 'id' | 'dataCriacao' | 'dataUltimaAtualizacao' | 'horasRegistradas' | 'usuarioId'>): Meta {
    const usuario = this.obterUsuarioAtual();
    if (!usuario) throw new Error('Usuário não encontrado');

    const meta: Meta = {
      id: crypto.randomUUID(),
      usuarioId: usuario.id,
      dataCriacao: new Date(),
      dataUltimaAtualizacao: new Date(),
      horasRegistradas: 0,
      ...dados
    };

    const metas = this.obterMetas();
    metas.push(meta);
    storage.set('metas', metas);
    
    return meta;
  }

  static obterMetas(apenasAtivas = false): Meta[] {
    const metas = storage.get<Meta[]>('metas') || [];
    return apenasAtivas ? metas.filter(m => m.ativa) : metas;
  }

  static obterMetaPorId(id: string): Meta | null {
    const metas = this.obterMetas();
    return metas.find(m => m.id === id) || null;
  }

  static atualizarMeta(id: string, dadosAtualizados: Partial<Meta>): void {
    const metas = this.obterMetas();
    const index = metas.findIndex(m => m.id === id);
    
    if (index !== -1) {
      metas[index] = {
        ...metas[index],
        ...dadosAtualizados,
        dataUltimaAtualizacao: new Date()
      };
      storage.set('metas', metas);
    }
  }

  static excluirMeta(id: string): void {
    const metas = this.obterMetas();
    const metasFiltradas = metas.filter(m => m.id !== id);
    storage.set('metas', metasFiltradas);
    
    // Também remove sessões relacionadas
    const sessoes = this.obterSessoes();
    const sessoesFiltradas = sessoes.filter(s => s.metaId !== id);
    storage.set('sessoes', sessoesFiltradas);
  }

  // SESSÕES
  static criarSessao(dados: Omit<Sessao, 'id' | 'usuarioId'>): Sessao {
    const usuario = this.obterUsuarioAtual();
    if (!usuario) throw new Error('Usuário não encontrado');

    const sessao: Sessao = {
      id: crypto.randomUUID(),
      usuarioId: usuario.id,
      ...dados
    };

    const sessoes = this.obterSessoes();
    sessoes.push(sessao);
    storage.set('sessoes', sessoes);

    // Atualiza horas da meta
    this.atualizarHorasMeta(dados.metaId);
    
    return sessao;
  }

  static obterSessoes(filtros?: FiltroSessoes, ordenacao?: OrdenacaoSessoes): Sessao[] {
    let sessoes = storage.get<Sessao[]>('sessoes') || [];

    // Aplicar filtros
    if (filtros) {
      if (filtros.metaId) {
        sessoes = sessoes.filter(s => s.metaId === filtros.metaId);
      }
      if (filtros.tipo) {
        sessoes = sessoes.filter(s => s.tipo === filtros.tipo);
      }
      if (filtros.dataInicio) {
        sessoes = sessoes.filter(s => new Date(s.data) >= filtros.dataInicio!);
      }
      if (filtros.dataFim) {
        sessoes = sessoes.filter(s => new Date(s.data) <= filtros.dataFim!);
      }
      if (filtros.duracaoMinima) {
        sessoes = sessoes.filter(s => s.duracao >= filtros.duracaoMinima!);
      }
    }

    // Aplicar ordenação
    if (ordenacao) {
      sessoes.sort((a, b) => {
        let valorA: any, valorB: any;
        
        switch (ordenacao.campo) {
          case 'data':
            valorA = new Date(a.data);
            valorB = new Date(b.data);
            break;
          case 'duracao':
            valorA = a.duracao;
            valorB = b.duracao;
            break;
          case 'meta':
            const metaA = this.obterMetaPorId(a.metaId);
            const metaB = this.obterMetaPorId(b.metaId);
            valorA = metaA?.titulo || '';
            valorB = metaB?.titulo || '';
            break;
        }

        if (ordenacao.direcao === 'desc') {
          return valorB > valorA ? 1 : -1;
        } else {
          return valorA > valorB ? 1 : -1;
        }
      });
    } else {
      // Ordenação padrão: mais recente primeiro
      sessoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }

    return sessoes;
  }

  static obterSessaoPorId(id: string): Sessao | null {
    const sessoes = this.obterSessoes();
    return sessoes.find(s => s.id === id) || null;
  }

  static atualizarSessao(id: string, dadosAtualizados: Partial<Sessao>): void {
    const sessoes = this.obterSessoes();
    const index = sessoes.findIndex(s => s.id === id);
    
    if (index !== -1) {
      const sessaoAntiga = sessoes[index];
      sessoes[index] = { ...sessaoAntiga, ...dadosAtualizados };
      storage.set('sessoes', sessoes);
      
      // Recalcula horas da meta
      this.atualizarHorasMeta(sessaoAntiga.metaId);
    }
  }

  static excluirSessao(id: string): void {
    const sessoes = this.obterSessoes();
    const sessao = sessoes.find(s => s.id === id);
    
    if (sessao) {
      const sessoesFiltradas = sessoes.filter(s => s.id !== id);
      storage.set('sessoes', sessoesFiltradas);
      
      // Recalcula horas da meta
      this.atualizarHorasMeta(sessao.metaId);
    }
  }

  // Atualizar horas totais de uma meta
  private static atualizarHorasMeta(metaId: string): void {
    const sessoes = this.obterSessoes({ metaId });
    const horasTotal = sessoes.reduce((total, sessao) => total + (sessao.duracao / 60), 0);
    
    this.atualizarMeta(metaId, { horasRegistradas: horasTotal });
  }

  // ESTATÍSTICAS
  static obterEstatisticasGerais() {
    const metas = this.obterMetas();
    const sessoes = this.obterSessoes();
    const horasTotal = sessoes.reduce((total, s) => total + (s.duracao / 60), 0);
    
    // Estatísticas da última semana
    const umaSemanAtras = new Date();
    umaSemanAtras.setDate(umaSemanAtras.getDate() - 7);
    const sessoesUltimaSemana = sessoes.filter(s => new Date(s.data) >= umaSemanAtras);
    const horasUltimaSemana = sessoesUltimaSemana.reduce((total, s) => total + (s.duracao / 60), 0);
    
    // Meta mais praticada
    const horasPorMeta = new Map<string, number>();
    sessoes.forEach(s => {
      const atual = horasPorMeta.get(s.metaId) || 0;
      horasPorMeta.set(s.metaId, atual + (s.duracao / 60));
    });
    
    let metaMaisPraticada = null;
    let maiorHoras = 0;
    horasPorMeta.forEach((horas, metaId) => {
      if (horas > maiorHoras) {
        maiorHoras = horas;
        metaMaisPraticada = this.obterMetaPorId(metaId);
      }
    });

    return {
      totalMetas: metas.length,
      metasAtivas: metas.filter(m => m.ativa).length,
      horasTotal,
      totalSessoes: sessoes.length,
      horasUltimaSemana,
      sessoesUltimaSemana: sessoesUltimaSemana.length,
      metaMaisPraticada,
      mediaHorasPorDia: horasTotal / Math.max(1, this.calcularDiasAtivos()),
      metaComMaiorProgresso: this.obterMetaComMaiorProgresso()
    };
  }

  private static calcularDiasAtivos(): number {
    const sessoes = this.obterSessoes();
    const diasUnicos = new Set(
      sessoes.map(s => new Date(s.data).toDateString())
    );
    return diasUnicos.size || 1;
  }

  private static obterMetaComMaiorProgresso(): Meta | null {
    const metas = this.obterMetas(true);
    return metas.reduce((melhor, atual) => {
      const progressoAtual = (atual.horasRegistradas / atual.horasObjetivo) * 100;
      const progressoMelhor = melhor ? (melhor.horasRegistradas / melhor.horasObjetivo) * 100 : 0;
      return progressoAtual > progressoMelhor ? atual : melhor;
    }, null as Meta | null);
  }

  // CONQUISTAS
  static inicializarConquistas(): void {
    const conquistasExistentes = storage.get<Conquista[]>('conquistas');
    if (!conquistasExistentes) {
      const conquistasPadrao = this.obterConquistasPadrao();
      storage.set('conquistas', conquistasPadrao);
    }
  }

  static obterConquistasBase(): Conquista[] {
    return storage.get<Conquista[]>('conquistas') || this.obterConquistasPadrao();
  }

  static obterConquistasUsuario(): ConquistaUsuario[] {
    return storage.get<ConquistaUsuario[]>('conquistas_usuario') || [];
  }

  private static obterConquistasPadrao(): Conquista[] {
    return [
      { id: '1', titulo: 'Primeiros Passos', descricao: 'Complete sua primeira hora de prática', icone: '🎯', tipo: 'horas', condicao: 1, desbloqueada: false },
      { id: '2', titulo: 'Dedicação', descricao: 'Alcance 10 horas de prática', icone: '⏰', tipo: 'horas', condicao: 10, desbloqueada: false },
      { id: '3', titulo: 'Persistência', descricao: 'Alcance 50 horas de prática', icone: '💪', tipo: 'horas', condicao: 50, desbloqueada: false },
      { id: '4', titulo: 'Centena', descricao: 'Alcance 100 horas de prática', icone: '💯', tipo: 'horas', condicao: 100, desbloqueada: false },
      { id: '5', titulo: 'Meio Caminho', descricao: 'Alcance 500 horas de prática', icone: '🔥', tipo: 'horas', condicao: 500, desbloqueada: false },
      { id: '6', titulo: 'Milhar', descricao: 'Alcance 1.000 horas de prática', icone: '🏆', tipo: 'horas', condicao: 1000, desbloqueada: false },
      { id: '7', titulo: 'Expert em Formação', descricao: 'Alcance 2.500 horas de prática', icone: '⭐', tipo: 'horas', condicao: 2500, desbloqueada: false },
      { id: '8', titulo: 'Quase Mestre', descricao: 'Alcance 5.000 horas de prática', icone: '👑', tipo: 'horas', condicao: 5000, desbloqueada: false },
      { id: '9', titulo: 'Rumo à Maestria', descricao: 'Alcance 7.500 horas de prática', icone: '🌟', tipo: 'horas', condicao: 7500, desbloqueada: false },
      { id: '10', titulo: 'MESTRE - 10.000 Horas!', descricao: 'Parabéns! Você alcançou a maestria!', icone: '🎖️', tipo: 'horas', condicao: 10000, desbloqueada: false },
      { id: '11', titulo: 'Consistência', descricao: 'Pratique por 7 dias consecutivos', icone: '📅', tipo: 'consistencia', condicao: 7, desbloqueada: false },
      { id: '12', titulo: 'Rotina', descricao: 'Pratique por 30 dias consecutivos', icone: '🗓️', tipo: 'consistencia', condicao: 30, desbloqueada: false },
      { id: '13', titulo: 'Meta Alcançada', descricao: 'Complete sua primeira meta', icone: '🎯', tipo: 'meta', condicao: 1, desbloqueada: false },
      { id: '14', titulo: 'Multi-talento', descricao: 'Tenha 3 metas ativas simultaneamente', icone: '🎭', tipo: 'especial', condicao: 3, desbloqueada: false },
      { id: '15', titulo: 'Maratonista', descricao: 'Complete uma sessão de 4+ horas', icone: '🏃', tipo: 'especial', condicao: 240, desbloqueada: false }
    ];
  }

  static obterConquistaPorId(conquistaId: string): Conquista | null {
    const conquistas = storage.get<Conquista[]>('conquistas') || [];
    return conquistas.find(c => c.id === conquistaId) || null;
  }

  static verificarNovasConquistas(): ConquistaUsuario[] {
    const usuario = this.obterUsuarioAtual();
    if (!usuario) return [];

    const conquistasDesbloqueadas: ConquistaUsuario[] = [];
    const conquistas = storage.get<Conquista[]>('conquistas') || [];
    const conquistasUsuario = storage.get<ConquistaUsuario[]>('conquistas_usuario') || [];
    
    const idsJaDesbloqueadas = new Set(conquistasUsuario.map(c => c.conquistaId));
    
    conquistas.forEach(conquista => {
      if (!idsJaDesbloqueadas.has(conquista.id) && this.verificarCondicaoConquista(conquista)) {
        const conquistaUsuario: ConquistaUsuario = {
          id: crypto.randomUUID(),
          usuarioId: usuario.id,
          conquistaId: conquista.id,
          dataDesbloqueio: new Date()
        };
        
        conquistasDesbloqueadas.push(conquistaUsuario);
        conquistasUsuario.push(conquistaUsuario);
      }
    });
    
    if (conquistasDesbloqueadas.length > 0) {
      storage.set('conquistas_usuario', conquistasUsuario);
    }
    
    return conquistasDesbloqueadas;
  }

  private static verificarCondicaoConquista(conquista: Conquista): boolean {
    const estatisticas = this.obterEstatisticasGerais();
    
    switch (conquista.tipo) {
      case 'horas':
        return estatisticas.horasTotal >= conquista.condicao;
        
      case 'consistencia':
        return this.verificarConsistencia(conquista.condicao);
        
      case 'meta':
        const metasCompletas = this.obterMetas().filter(m => 
          m.horasRegistradas >= m.horasObjetivo
        ).length;
        return metasCompletas >= conquista.condicao;
        
      case 'especial':
        if (conquista.id === '14') { // Multi-talento
          return estatisticas.metasAtivas >= conquista.condicao;
        }
        if (conquista.id === '15') { // Maratonista
          const sessoes = this.obterSessoes();
          return sessoes.some(s => s.duracao >= conquista.condicao);
        }
        return false;
        
      default:
        return false;
    }
  }

  private static verificarConsistencia(diasConsecutivos: number): boolean {
    const sessoes = this.obterSessoes();
    if (sessoes.length === 0) return false;
    
    // Agrupa sessões por data
    const sessoesPerDay = new Map<string, boolean>();
    sessoes.forEach(s => {
      const data = new Date(s.data).toDateString();
      sessoesPerDay.set(data, true);
    });
    
    // Verifica sequência atual
    let sequenciaAtual = 0;
    const hoje = new Date();
    
    for (let i = 0; i < diasConsecutivos; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      
      if (sessoesPerDay.has(data.toDateString())) {
        sequenciaAtual++;
      } else {
        break;
      }
    }
    
    return sequenciaAtual >= diasConsecutivos;
  }
}

// Inicializar sistema na primeira execução
if (typeof window !== 'undefined') {
  DataManager.inicializarConquistas();
}