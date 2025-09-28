import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/components': path.resolve(__dirname, './src/components'),
    }
  }
});
