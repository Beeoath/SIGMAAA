import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const publishableKey = 
    (process.env.SUPABASE_PUBLISHABLE_KEY && !process.env.SUPABASE_PUBLISHABLE_KEY.startsWith('sb_secret_'))
      ? process.env.SUPABASE_PUBLISHABLE_KEY
      : (process.env.VITE_SUPABASE_ANON_KEY && !process.env.VITE_SUPABASE_ANON_KEY.startsWith('sb_secret_'))
        ? process.env.VITE_SUPABASE_ANON_KEY
        : 'sb_publishable_iaBQ513XFuMjofZtkIFOpg_2TygfPAz';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(publishableKey),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(publishableKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
