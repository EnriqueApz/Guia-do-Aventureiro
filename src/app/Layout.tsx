import { BookOpen, Home, ScrollText, Users } from 'lucide-react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';
import { LogoMark } from '@/components/art/Logo';
import { cn } from '@/lib/cn';
import { SettingsMenu } from './SettingsMenu';
import { useApplySettings } from './useApplySettings';

const nav = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/personagens', label: 'Personagens', icon: Users },
  { to: '/glossario', label: 'Glossário', icon: BookOpen },
  { to: '/guia-rapido', label: 'Guia rápido', icon: ScrollText },
];

export function Layout() {
  useApplySettings();

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-2.5 rounded-md">
            <LogoMark className="size-9 text-ink" />
            <span className="font-display text-lg leading-none font-semibold tracking-tight">
              Guia do
              <span className="block text-sm font-medium tracking-[0.18em] text-gold uppercase">
                Aventureiro
              </span>
            </span>
          </Link>

          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex gap-1">
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-11 items-center rounded-lg px-3 font-display font-semibold transition-colors',
                        isActive ? 'bg-sunken text-ink' : 'text-ink-muted hover:text-ink',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <SettingsMenu />
        </div>
      </header>

      <main
        id="conteudo"
        tabIndex={-1}
        className="mx-auto max-w-6xl px-4 pt-6 pb-28 outline-none md:pb-16"
      >
        <Outlet />
      </main>

      <footer className="border-t border-line pb-24 md:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-ink-muted">
          <p>
            Este site usa material do <em>System Reference Document 5.2</em> da Wizards of the Coast
            LLC, licenciado sob{' '}
            <a
              className="underline underline-offset-2 hover:text-ink"
              href="https://creativecommons.org/licenses/by/4.0/deed.pt-br"
            >
              CC BY 4.0
            </a>
            , traduzido e adaptado. Não é oficial nem endossado pela Wizards of the Coast.{' '}
            <Link to="/sobre" className="underline underline-offset-2 hover:text-ink">
              Créditos e licenças
            </Link>
            .
          </p>
        </div>
      </footer>

      {/* Navegação inferior no celular: ao alcance do polegar. */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="grid grid-cols-4">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold',
                    isActive ? 'text-seal' : 'text-ink-muted',
                  )
                }
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <ScrollRestoration />
    </>
  );
}
