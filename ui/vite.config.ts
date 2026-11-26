import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function redirectRootToUi(): Plugin {
  const redirectMiddleware = (
    req: { url?: string },
    res: { statusCode: number; setHeader: (k: string, v: string) => void; end: () => void },
    next: () => void,
  ) => {
    if (req.url === '/' || req.url === '') {
      res.statusCode = 302;
      res.setHeader('Location', '/ui/');
      res.end();
      return;
    }
    next();
  };

  return {
    name: 'redirect-root-to-ui',
    configureServer(server) {
      server.middlewares.use(redirectMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(redirectMiddleware);
    },
  };
}

export default defineConfig({
  base: '/ui/',
  plugins: [react(), tailwindcss(), redirectRootToUi()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
});
