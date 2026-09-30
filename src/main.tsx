import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element in index.html');

const keepRequestBodiesOutOfConsole = true;

async function startMockApiBeforeFirstRender() {
  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: keepRequestBodiesOutOfConsole,
  });
}

try {
  await startMockApiBeforeFirstRender();
} catch (error) {
  console.error('Mock API failed to start; registration will fail.', error);
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
