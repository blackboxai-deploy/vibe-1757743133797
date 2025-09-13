'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/components/providers/app-provider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AuthPage() {
  const { login, register } = useApp();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Estados para login
  const [loginData, setLoginData] = useState({
    email: '',
    senha: ''
  });

  // Estados para registro
  const [registerData, setRegisterData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.senha) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      const sucesso = await login(loginData.email, loginData.senha);
      if (sucesso) {
        toast.success('Login realizado com sucesso!');
        router.push('/');
      } else {
        toast.error('Email ou senha incorretos');
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!registerData.nome || !registerData.email || !registerData.senha || !registerData.confirmarSenha) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    if (registerData.senha !== registerData.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (registerData.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const sucesso = await register(registerData.nome, registerData.email, registerData.senha);
      if (sucesso) {
        toast.success('Conta criada com sucesso!');
        router.push('/');
      } else {
        toast.error('Email já está sendo utilizado');
      }
    } catch (error) {
      toast.error('Erro ao criar conta');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            ⏳
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            10.000 Horas
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Sua jornada rumo à maestria começa aqui
          </p>
        </div>

        {/* Auth Forms */}
        <Card className="shadow-xl">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Criar Conta</TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* Login Tab */}
            <TabsContent value="login">
              <CardHeader className="pt-0">
                <CardTitle>Bem-vindo de volta!</CardTitle>
                <CardDescription>
                  Entre na sua conta para continuar acompanhando seu progresso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Sua senha"
                      value={loginData.senha}
                      onChange={(e) => setLoginData(prev => ({ ...prev, senha: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Demo: Use qualquer email e senha para testar
                  </p>
                </div>
              </CardContent>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <CardHeader className="pt-0">
                <CardTitle>Crie sua conta</CardTitle>
                <CardDescription>
                  Comece sua jornada de 10.000 horas hoje mesmo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nome completo</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="João Silva"
                      value={registerData.nome}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, nome: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={registerData.senha}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, senha: e.target.value }))}
                      disabled={isLoading}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Confirmar senha</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="Digite a senha novamente"
                      value={registerData.confirmarSenha}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Transforme seu tempo em maestria. Uma hora por vez.
          </p>
        </div>
      </div>
    </div>
  );
}