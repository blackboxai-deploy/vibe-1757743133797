'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Usuario } from '@/types';
import { DataManager } from '@/lib/data-manager';
import { ThemeProvider } from 'next-themes';

interface AppContextType {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  register: (nome: string, email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  atualizarUsuario: (dados: Partial<Usuario>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  return context;
}

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Carregar usuário do localStorage na inicialização
    const usuarioSalvo = DataManager.obterUsuarioAtual();
    setUsuario(usuarioSalvo);
    setCarregando(false);
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    // Simulação de autenticação local simplificada
    // Em produção, isso seria uma validação real
    try {
      const usuarioExistente = DataManager.obterUsuarioAtual();
      
      if (usuarioExistente && usuarioExistente.email === email) {
        setUsuario(usuarioExistente);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const register = async (nome: string, email: string, senha: string): Promise<boolean> => {
    try {
      // Verificar se já existe usuário com este email
      const usuarioExistente = DataManager.obterUsuarioAtual();
      if (usuarioExistente && usuarioExistente.email === email) {
        return false; // Email já existe
      }

      // Criar novo usuário
      const novoUsuario = DataManager.criarUsuario({
        nome,
        email,
        configuracoes: {
          notificacoes: true,
          metaHorasDiaria: 2,
          tema: 'system'
        }
      });

      setUsuario(novoUsuario);
      return true;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    }
  };

  const logout = () => {
    setUsuario(null);
    // Manter os dados mas remover referência do usuário atual
    // Em um sistema real, isso seria mais sofisticado
  };

  const atualizarUsuario = (dados: Partial<Usuario>) => {
    if (usuario) {
      const usuarioAtualizado = { ...usuario, ...dados };
      DataManager.atualizarUsuario(dados);
      setUsuario(usuarioAtualizado);
    }
  };

  const contextValue: AppContextType = {
    usuario,
    carregando,
    login,
    register,
    logout,
    atualizarUsuario,
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AppContext.Provider value={contextValue}>
        {children}
      </AppContext.Provider>
    </ThemeProvider>
  );
}