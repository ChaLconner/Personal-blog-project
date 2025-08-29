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
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-alert-dialog', '@radix-ui/react-avatar', '@radix-ui/react-dropdown-menu'],
          'utils-vendor': ['axios', 'clsx', 'tailwind-merge'],
          'icons-vendor': ['lucide-react'],
          
          // Feature chunks
          'admin': [
            'src/pages/admin/AdminDashboardPage.jsx',
            'src/pages/admin/AdminArticlePage.jsx',
            'src/pages/admin/AdminCreateArticle.jsx',
            'src/pages/admin/AdminCategoryPage.jsx',
            'src/pages/admin/AdminCreateCategoryPage.jsx',
            'src/pages/admin/AdminEditArticlePage.jsx',
            'src/pages/admin/AdminEditCategoryPage.jsx',
            'src/pages/admin/AdminLoginPage.jsx',
            'src/pages/admin/AdminNotificationPage.jsx',
            'src/pages/admin/AdminProfilePage.jsx',
            'src/pages/admin/AdminResetPasswordPage.jsx'
          ],
          
          // Heavy components
          'markdown': ['react-markdown'],
          'charts': ['framer-motion']
        }
      }
    },
    
    // Reduce chunk size warning limit
    chunkSizeWarningLimit: 600,
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Minification options
    minify: 'esbuild',
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

