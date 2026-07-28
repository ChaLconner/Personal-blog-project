import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
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
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
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
      'react-router-dom',
      'axios',
      'lucide-react',
      'react-markdown',  // Include instead of exclude to fix ES module issues
      'style-to-js',
      'unist-util-visit',
      'property-information',
      'hast-util-whitespace'
    ]
  }
})

