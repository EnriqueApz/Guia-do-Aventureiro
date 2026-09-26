/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// No GitHub Pages o site fica em /Guia-do-Aventureiro/. Localmente e nos testes, na raiz.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    // App instalável que funciona offline depois da primeira visita (não roda nos testes).
    ...(process.env.VITEST
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'script-defer',
            includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
            manifest: {
              name: 'Guia do Aventureiro',
              short_name: 'Guia',
              description:
                'Crie personagens de D&D 5e (regras de 2024) em português, passo a passo, e jogue com a ficha no celular.',
              lang: 'pt-BR',
              start_url: base,
              scope: base,
              display: 'standalone',
              background_color: '#f3ead6',
              theme_color: '#8e2f22',
              icons: [
                { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
                {
                  src: 'icon-maskable-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
              navigateFallback: `${base}index.html`,
              // O pacote de conteúdo (com as 339 magias) passa de 2 MB sem compressão.
              maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
              cleanupOutdatedCaches: true,
            },
          }),
        ]),
  ],
  // O manifesto permite medir o bundle inicial (npm run size).
  build: { manifest: true },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/rules/**', 'src/content/validate.ts'],
      exclude: ['**/__tests__/**', '**/*.test.ts'],
      thresholds: { 'src/rules/**': { lines: 95, functions: 95, statements: 95, branches: 85 } },
    },
  },
});
