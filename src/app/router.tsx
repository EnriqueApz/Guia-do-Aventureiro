import { createBrowserRouter, type RouteObject } from 'react-router';
import { Layout } from './Layout';
import { RouteError } from '@/routes/RouteError';

/** Cada página vira um pedaço separado do bundle (carregado sob demanda). */
const page = (loader: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await loader()).default,
});

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: Layout,
    ErrorBoundary: RouteError,
    children: [
      { index: true, lazy: page(() => import('@/routes/HomePage')) },
      { path: 'personagens', lazy: page(() => import('@/routes/CharactersPage')) },
      { path: 'ficha/:id', lazy: page(() => import('@/features/sheet/SheetPage')) },
      { path: 'ficha/:id/imprimir', lazy: page(() => import('@/features/sheet/PrintPage')) },
      { path: 'ver', lazy: page(() => import('@/features/sheet/SharedPage')) },
      { path: 'criar/:id/:etapa?', lazy: page(() => import('@/features/wizard/WizardPage')) },
      { path: 'glossario', lazy: page(() => import('@/features/glossary/GlossaryPage')) },
      { path: 'guia-rapido', lazy: page(() => import('@/features/quickGuide/QuickGuidePage')) },
      { path: 'comparar', lazy: page(() => import('@/features/compare/ComparePage')) },
      { path: 'mesa', lazy: page(() => import('@/features/table/TablePage')) },
      { path: 'conteudo', lazy: page(() => import('@/features/homebrew/ContentPage')) },
      { path: 'sobre', lazy: page(() => import('@/routes/AboutPage')) },
      { path: 'design', lazy: page(() => import('@/routes/DesignPage')) },
      { path: '*', lazy: page(() => import('@/routes/NotFoundPage')) },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes, { basename: import.meta.env.BASE_URL });
}
