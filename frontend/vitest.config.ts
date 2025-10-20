import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/routeTree.gen.ts',
        'src/pages/**',
        'src/routes/**',
        'src/components/layout/**',
        'src/components/auth/BusinessNameModal.tsx',
        'src/components/auth/ForgotPasswordModal.tsx',
        'src/components/auth/LoginModal.tsx',
        'src/components/auth/OTPVerificationModal.tsx',
        'src/components/auth/RegisterModal.tsx',
        'src/components/ui/ChatWindow.tsx',
        'src/components/ui/CountdownTimer.tsx',
        'src/components/ui/LocationTracker.tsx',
        'src/components/ui/Map.tsx',
        'src/components/ui/Select.tsx',
        'src/components/ui/Spinner.tsx',
        'src/lib/axios.ts',
      ],
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 30,
        statements: 30,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

