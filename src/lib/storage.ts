// Abstração para localStorage com suporte a tipos
export class StorageManager {
  private prefix = '10000horas_';

  // Salvar dados
  set<T>(key: string, data: T): void {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(this.prefix + key, serializedData);
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }

  // Recuperar dados
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
      return null;
    }
  }

  // Remover item
  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Erro ao remover do localStorage:', error);
    }
  }

  // Limpar todos os dados
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }
  }

  // Verificar se existe
  exists(key: string): boolean {
    return localStorage.getItem(this.prefix + key) !== null;
  }

  // Obter todas as chaves com o prefixo
  getKeys(): string[] {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.substring(this.prefix.length));
  }

  // Obter tamanho dos dados armazenados
  getSize(): number {
    const keys = this.getKeys();
    let totalSize = 0;
    
    keys.forEach(key => {
      const item = localStorage.getItem(this.prefix + key);
      if (item) {
        totalSize += item.length;
      }
    });
    
    return totalSize;
  }
}

// Instância singleton
export const storage = new StorageManager();

// Hooks para serialização de datas
export const serializeDate = (date: Date): string => {
  return date.toISOString();
};

export const deserializeDate = (dateString: string): Date => {
  return new Date(dateString);
};

// Utilitários para backup e restauração
export const exportData = (): string => {
  const data: Record<string, unknown> = {};
  const keys = storage.getKeys();
  
  keys.forEach(key => {
    data[key] = storage.get(key);
  });
  
  return JSON.stringify({
    version: '1.0',
    timestamp: new Date().toISOString(),
    data
  }, null, 2);
};

export const importData = (jsonData: string): boolean => {
  try {
    const parsed = JSON.parse(jsonData);
    
    if (!parsed.data || !parsed.version) {
      throw new Error('Formato de dados inválido');
    }
    
    // Limpar dados existentes
    storage.clear();
    
    // Importar novos dados
    Object.entries(parsed.data).forEach(([key, value]) => {
      storage.set(key, value);
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao importar dados:', error);
    return false;
  }
};

// Verificação de integridade
export const validateDataIntegrity = (): boolean => {
  try {
    const usuario = storage.get('usuario_atual');
    if (!usuario) return false;
    
    const metas = storage.get('metas') || [];
    const sessoes = storage.get('sessoes') || [];
    
    // Verificações básicas
    if (!Array.isArray(metas) || !Array.isArray(sessoes)) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro na verificação de integridade:', error);
    return false;
  }
};

// Limpeza de dados orfãos
export const cleanOrphanedData = (): void => {
  try {
    const metas = storage.get<any[]>('metas') || [];
    const sessoes = storage.get<any[]>('sessoes') || [];
    
    const metaIds = new Set(metas.map(m => m.id));
    
    // Remove sessões órfãs
    const sessoesLimpas = sessoes.filter(s => metaIds.has(s.metaId));
    
    if (sessoesLimpas.length !== sessoes.length) {
      storage.set('sessoes', sessoesLimpas);
      console.log(`Removidas ${sessoes.length - sessoesLimpas.length} sessões órfãs`);
    }
  } catch (error) {
    console.error('Erro na limpeza de dados:', error);
  }
};