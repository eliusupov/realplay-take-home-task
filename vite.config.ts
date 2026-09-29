import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // React Compiler on React 18: compiled output imports react-compiler-runtime.
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset({ target: '18' })] }),
  ],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: {
    rolldownOptions: {
      onwarn(warning, warn) {
        // The runtime's own "use no memo" directive is a compiler opt-out marker; dropping it when bundling is harmless.
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
          warning.id?.includes('react-compiler-runtime')
        )
          return;
        warn(warning);
      },
    },
  },
});
