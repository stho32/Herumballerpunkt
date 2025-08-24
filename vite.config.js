import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  base: './',
  
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      },
      
      output: {
        manualChunks: {
          // Core modules
          'core': [
            './core/ServiceContainer.js',
            './core/EventBus.js',
            './core/GameEngine.js'
          ],
          
          // Systems
          'systems': [
            './systems/RenderSystem.js',
            './systems/InputManager.js',
            './systems/AudioManager.js',
            './systems/EntityManager.js'
          ],
          
          // Configuration
          'config': [
            './config/GameConfig.js',
            './config/SystemConfig.js'
          ],
          
          // Utilities
          'utils': [
            './utils/MathUtils.js',
            './utils/CollisionUtils.js',
            './utils/PerformanceUtils.js'
          ]
        }
      }
    },
    
    // Optimization settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true
      }
    },
    
    // Asset handling
    assetsDir: 'assets',
    assetsInlineLimit: 4096,
    
    // Target modern browsers
    target: 'es2020'
  },
  
  server: {
    port: 3000,
    open: true,
    cors: true,
    
    // Hot reload settings
    hmr: {
      overlay: true
    }
  },
  
  preview: {
    port: 4173,
    open: true
  },
  
  // Development optimizations
  optimizeDeps: {
    include: []
  },
  
  // Plugin configuration
  plugins: [],
  
  // Define global constants
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },
  
  // CSS configuration
  css: {
    devSourcemap: true
  },
  
  // Worker configuration for potential web workers
  worker: {
    format: 'es'
  }
});
