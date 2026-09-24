import { defineConfig } from 'vite';

/**
 * Serveur du banc de rendu visuel (voir README.md). Pas de
 * `@vitejs/plugin-react` : le socle n'ajoute aucune dépendance de build au-delà
 * de `vite`, déjà présent (dépendance transitoire de `vitest`) — la transformation
 * JSX de esbuild suffit, `jsx: 'automatic'` reprend le runtime `react-jsx` déjà
 * déclaré dans `tsconfig.json`.
 */
export default defineConfig({
  root: import.meta.dirname,
  esbuild: {
    jsx: 'automatic',
  },
  optimizeDeps: {
    // Évite un rechargement à chaud du premier essai (l'optimiseur de deps de
    // Vite découvre normalement ces paquets lors du tout premier rendu, ce qui
    // force un reload de page en cours de capture) — la liste couvre les
    // paquets réellement importés par le canon + le banc.
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router',
      '@mantine/core',
      '@mantine/hooks',
      '@mantine/form',
      '@mantine/modals',
      '@mantine/notifications',
      '@mantine/charts',
      '@mantine/dates',
      '@tabler/icons-react',
      'mantine-datatable',
      'mantine-form-zod-resolver',
      'zod',
      'dayjs',
      'react-zoom-pan-pinch',
    ],
  },
  server: {
    // `host` EXPLICITE : le défaut `localhost` s'est résolu sur cette machine
    // vers une interface que Playwright (`127.0.0.1` en dur) n'atteignait pas
    // — le serveur annonçait « ready » sans jamais accepter de connexion,
    // constaté à la main avant d'écrire cette ligne (`/proc/net/tcp` sans
    // aucun LISTEN sur le port tant que `host` restait implicite).
    host: '127.0.0.1',
    strictPort: true,
  },
});
