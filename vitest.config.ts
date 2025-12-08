import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	test: {
		environment: 'jsdom',
		setupFiles: './src/test/setup.ts',
		globals: true,
		// Solo queremos que `npm test` ejecute los tests del front.
		// Excluimos los E2E de Playwright y los tests del backend (`Server`).
		exclude: [
			...configDefaults.exclude,
			'tests/e2e/**',
			'Server/**',
		],
	},
});

