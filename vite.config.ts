import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

console.log(">>> VITE ROOT:", __dirname);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    root: '.', // 👈 Assicura che index.html sia la root reale

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },

    build: {
      outDir: 'dist', // 👈 Necessario per Capacitor
      emptyOutDir: true, // 👈 Pulisce dist prima della build

      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html') // 👈 QUESTA È LA CHIAVE
        }
      }
    }
  };
});
