import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    // theme.test.ts est un test de conformité de MARQUE (compare les tokens à
    // `GUIDELINES UI-UX GRADILIS.md`, hors socle). Il sera relocalisé dans l'app
    // pépinière en Étape 4, une fois le thème rendu agnostique (Étape 2).
    exclude: ['**/node_modules/**', 'src/theme.test.ts'],
  },
});
