import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'node',
        globals: true,
        setupFiles: ['./__tests__/setup.ts'],
        include: ['__tests__/**/*.test.{ts,tsx}'],
        exclude: ['node_modules', '.next', 'e2e'],
        pool: 'threads',
        server: {
            deps: {
                inline: [/@testing-library/],
            },
        },
        coverage: {
            provider: 'v8',
            include: [
                'src/app/api/**/*.ts',
                'src/lib/**/*.ts',
                'src/components/**/*.tsx',
            ],
            exclude: [
                'src/lib/epaper-generator.ts',
                'src/lib/epaper-scraper.ts',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
