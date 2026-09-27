import './styles/fonts.css';
import './styles/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { keepUpdated } from './app/swUpdate';

const container = document.getElementById('root');
if (!container) throw new Error('Elemento #root não encontrado.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Só no site publicado (em desenvolvimento não há service worker).
if (import.meta.env.PROD) keepUpdated();
