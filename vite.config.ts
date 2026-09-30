import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset({ target: '18' })] }),
  ],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: {
    rolldownOptions: {
      onwarn(warning, warn) {
        const isCompilerRuntimeOptOutDirective =
          warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
          warning.id?.includes('react-compiler-runtime');
        if (isCompilerRuntimeOptOutDirective) return;
        warn(warning);
      },
    },
  },
});
