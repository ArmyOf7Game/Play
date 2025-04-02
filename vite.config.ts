import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';


export default defineConfig({
  plugins: [react(), nodePolyfills()],
  base: '/',
  server: {
   
    host: true, 
    strictPort: true,
    port: 5173, 
    allowedHosts: [
      'monitoring-referenced-alias-casting.trycloudflare.com',
      'localhost',
      
    ]
  }
});
