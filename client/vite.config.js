import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }

  if (command === 'build' && mode === 'production') {
    const requiredVariables = [
      'VITE_API_URL',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ]
    const missingVariables = requiredVariables.filter((name) => !env[name]?.trim())

    if (missingVariables.length > 0) {
      throw new Error(`Missing required production environment variables: ${missingVariables.join(', ')}`)
    }

    for (const name of ['VITE_API_URL', 'VITE_SUPABASE_URL']) {
      const url = new URL(env[name])
      if (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname)) {
        throw new Error(`${name} must use a non-local HTTPS URL for production builds`)
      }
    }
  }

  return {
  plugins: [react(),tailwindcss()],
  
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules/react/')) {
            return 'react-core';
          }
          if (id.includes('node_modules/react-dom/')) {
            return 'react-dom';
          }
          if (id.includes('node_modules/react-router/')) {
            return 'router';
          }
          if (id.includes('node_modules/@radix-ui/')) {
            return 'ui-vendor';
          }
          if (id.includes('node_modules/axios/') || id.includes('node_modules/clsx/') || id.includes('node_modules/tailwind-merge/')) {
            return 'utils-vendor';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'icons-vendor';
          }
          if (id.includes('node_modules/@supabase/')) {
            const packageName = id.split('node_modules/@supabase/')[1].split('/')[0];
            return `supabase-${packageName}`;
          }
          // Feature chunks
          if (id.includes('src/pages/admin/')) {
            return 'admin';
          }
          if (id.includes('node_modules/react-markdown/')) {
            return 'markdown';
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'charts';
          }
        }
      }
    },
    
    // Reduce chunk size warning limit
    chunkSizeWarningLimit: 600,
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Minification options
    minify: 'oxc',
    target: 'es2020'
  },
  
  // Optimize deps
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router',
      'axios',
      'lucide-react',
      'react-markdown',  // Include instead of exclude to fix ES module issues
      'style-to-js',
      'unist-util-visit',
      'property-information',
      'hast-util-whitespace'
    ]
  }
  }
})

