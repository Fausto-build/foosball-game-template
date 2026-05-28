import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Studio sandbox serves the dev server on 0.0.0.0:3000 behind a proxied domain.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 3000, allowedHosts: true },
  preview: { host: true, port: 3000, allowedHosts: true },
});
