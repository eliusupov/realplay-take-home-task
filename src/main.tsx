import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element in index.html');

// There is no backend in any mode (dev, build, preview), so the mock API must be
// ready before the first render. quiet: MSW's console log would print request bodies.
// Dynamic import keeps MSW in its own chunk instead of the app bundle.
try {
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
} catch (error) {
  console.error('Mock API failed to start; registration will fail.', error);
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
