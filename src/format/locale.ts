import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';

/**
 * Initialisation de la locale FR (GUIDELINES §5) — à appeler UNE fois dans
 * `main.tsx`, avant tout rendu. `@mantine/dates` s'appuie sur la locale
 * globale dayjs posée ici.
 */
export function setupLocale(): void {
  dayjs.extend(customParseFormat);
  dayjs.extend(localizedFormat);
  dayjs.locale('fr');
}
