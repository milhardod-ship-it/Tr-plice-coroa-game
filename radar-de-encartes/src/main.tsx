import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { ProvedorApp } from './ui/contexto';
import './ui/estilos.css';

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <ProvedorApp>
      <App />
    </ProvedorApp>
  </StrictMode>,
);
