'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useApp } from '@/components/providers/app-provider';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: '📊',
    description: 'Visão geral do seu progresso'
  },
  {
    title: 'Metas',
    href: '/metas',
    icon: '🎯',
    description: 'Gerencie suas metas de especialização'
  },
  {
    title: 'Cronômetro',
    href: '/cronometro',
    icon: '⏱️',
    description: 'Conte o tempo em tempo real'
  },
  {
    title: 'Registrar',
    href: '/registrar',
    icon: '📝',
    description: 'Adicione horas manualmente'
  },
  {
    title: 'Histórico',
    href: '/historico',
    icon: '📈',
    description: 'Veja seus registros e estatísticas'
  },
  {
    title: 'Conquistas',
    href: '/conquistas',
    icon: '🏆',
    description: 'Suas conquistas e marcos'
  },
];

export function Navigation() {
  const { usuario, logout } = useApp();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (!usuario) return null;

  const iniciais = usuario.nome
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
            ⏳
          </div>
          <div>
            <h1 className="text-xl font-bold">10.000 Horas</h1>
            <p className="text-sm opacity-90">Rumo à maestria</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white/30">
            <AvatarFallback className="bg-white/20 text-white font-semibold">
              {iniciais}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{usuario.nome}</p>
            <p className="text-xs opacity-75 truncate">{usuario.email}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors",
                "hover:bg-slate-100 dark:hover:bg-slate-800",
                isActive 
                  ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" 
                  : "text-slate-600 dark:text-slate-300"
              )}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs opacity-75 truncate">{item.description}</div>
              </div>
              {isActive && (
                <Badge variant="secondary" className="text-xs">
                  Ativo
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-3">
        <Link
          href="/perfil"
          onClick={() => setIsOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full",
            "hover:bg-slate-100 dark:hover:bg-slate-800",
            pathname === '/perfil'
              ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300"
              : "text-slate-600 dark:text-slate-300"
          )}
        >
          <span className="text-lg">⚙️</span>
          <span className="font-medium">Perfil & Configurações</span>
        </Link>
        
        <Button
          variant="ghost"
          onClick={() => {
            logout();
            setIsOpen(false);
          }}
          className="w-full justify-start gap-3 text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-300 dark:hover:text-red-400 dark:hover:bg-red-950"
        >
          <span className="text-lg">🚪</span>
          <span>Sair</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b dark:bg-slate-900/80">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
              ⏳
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white">10.000 Horas</h1>
            </div>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <div className="w-5 h-5 flex flex-col justify-between">
                  <div className="w-full h-0.5 bg-current rounded"></div>
                  <div className="w-full h-0.5 bg-current rounded"></div>
                  <div className="w-full h-0.5 bg-current rounded"></div>
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-80 bg-white dark:bg-slate-900 border-r shadow-sm">
        <NavContent />
      </div>

      {/* Mobile spacing */}
      <div className="lg:hidden h-16"></div>
    </>
  );
}