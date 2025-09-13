'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: 'Iniciar Cronômetro',
      description: 'Comece a registrar tempo agora',
      icon: '▶️',
      color: 'bg-green-500 hover:bg-green-600',
      href: '/cronometro',
      badge: 'Popular'
    },
    {
      title: 'Nova Meta',
      description: 'Defina um novo objetivo',
      icon: '🎯',
      color: 'bg-blue-500 hover:bg-blue-600',
      href: '/metas/nova'
    },
    {
      title: 'Registrar Horas',
      description: 'Adicione tempo manualmente',
      icon: '📝',
      color: 'bg-purple-500 hover:bg-purple-600',
      href: '/registrar'
    },
    {
      title: 'Ver Conquistas',
      description: 'Seus marcos e badges',
      icon: '🏆',
      color: 'bg-orange-500 hover:bg-orange-600',
      href: '/conquistas'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <div key={index} className="relative group">
            <Button
              onClick={() => router.push(action.href)}
              variant="outline"
              className="w-full h-auto p-4 justify-start text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 group-hover:shadow-sm"
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-white text-lg flex-shrink-0`}>
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm text-slate-900 dark:text-white">
                      {action.title}
                    </h4>
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {action.description}
                  </p>
                </div>
                <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                  →
                </div>
              </div>
            </Button>
          </div>
        ))}

        {/* Dica motivacional */}
        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="font-medium text-sm text-slate-900 dark:text-white mb-1">
                Dica do Dia
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                A consistência é mais importante que a intensidade. 
                Pratique um pouco todos os dias para criar o hábito da excelência.
              </p>
            </div>
          </div>
        </div>

        {/* Call to action motivacional */}
        <div className="pt-2">
          <Card className="border-dashed border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <CardContent className="p-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl">🚀</div>
                <h4 className="font-medium text-sm text-slate-900 dark:text-white">
                  Pronto para praticar?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cada minuto conta na sua jornada
                </p>
                <Button 
                  onClick={() => router.push('/cronometro')}
                  size="sm" 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Começar Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}