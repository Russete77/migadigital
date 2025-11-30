'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Brain,
  BarChart3,
  MessageSquare,
  Users,
  Shield,
  Settings,
  ChevronRight,
  FlaskConical,
  Sparkles,
  BookOpen,
  Upload,
  FolderOpen,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'AI Observatory',
    href: '/admin/ai-observatory',
    icon: Brain,
    badge: 'NOVO',
    children: [
      { name: 'Overview', href: '/admin/ai-observatory/overview', icon: BarChart3 },
      { name: 'ML Ops', href: '/admin/ai-observatory/mlops', icon: FlaskConical },
      { name: 'Comparação', href: '/admin/ai-observatory/comparison', icon: BarChart3 },
      { name: 'Sentimentos', href: '/admin/ai-observatory/sentiment', icon: Sparkles },
      { name: 'Humanização', href: '/admin/ai-observatory/humanization', icon: BarChart3 },
      { name: 'Performance', href: '/admin/ai-observatory/performance', icon: BarChart3 },
      { name: 'Feedback', href: '/admin/ai-observatory/feedback', icon: MessageSquare },
      { name: 'Crises', href: '/admin/ai-observatory/crisis', icon: Shield },
    ],
  },
  {
    name: 'Base de Conhecimento',
    href: '/admin/knowledge-base',
    icon: BookOpen,
    badge: 'RAG',
    children: [
      { name: 'Documentos', href: '/admin/knowledge-base/documents', icon: FolderOpen },
      { name: 'Upload', href: '/admin/knowledge-base/upload', icon: Upload },
    ],
  },
  {
    name: 'Usuárias',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Moderação',
    href: '/admin/moderation',
    icon: Shield,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Configurações',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-bg-secondary border-r border-border-default">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-border-default">
        <h1 className="text-xl font-bold text-flame-primary">Admin Panel</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <div key={item.name}>
            <Link
              href={item.href}
              className={`
                flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${
                  pathname === item.href || pathname?.startsWith(item.href + '/')
                    ? 'bg-flame-primary/10 text-flame-primary'
                    : 'text-text-secondary hover:bg-bg-elevated'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-flame-primary/20 text-flame-primary rounded-full">
                  {item.badge}
                </span>
              )}
              {item.children && (
                <ChevronRight className="w-4 h-4" />
              )}
            </Link>

            {/* Submenu */}
            {item.children && pathname?.startsWith(item.href) && (
              <div className="ml-4 mt-2 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.name}
                    href={child.href}
                    className={`
                      flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors
                      ${
                        pathname === child.href
                          ? 'bg-flame-primary/10 text-flame-primary font-medium'
                          : 'text-text-tertiary hover:bg-bg-elevated'
                      }
                    `}
                  >
                    <child.icon className="w-4 h-4" />
                    <span>{child.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border-default">
        <p className="text-xs text-text-tertiary text-center">
          SOS Emocional Admin
          <br />
          v1.0.0
        </p>
      </div>
    </aside>
  );
}
