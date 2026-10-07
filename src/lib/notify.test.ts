/**
 * `notify` — priorités d'affichage et issue `'warning'` de `resolve`.
 *
 * On observe la CHARGE passée à `@mantine/notifications` (espion sur
 * `notifications.show`/`update`) : c'est elle qui décide de l'ordre au-delà de la
 * limite de toasts, et la vérifier en DOM exigerait de saturer un provider.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '@mantine/notifications';
import { configureNotify, notify } from './notify.js';

afterEach(() => {
  vi.restoreAllMocks();
  configureNotify({});
});

const spyShow = () => vi.spyOn(notifications, 'show').mockImplementation((d) => d.id ?? 'x');
const spyUpdate = () => vi.spyOn(notifications, 'update').mockImplementation((d) => d.id ?? 'x');
const payload = (spy: { mock: { calls: unknown[][] } }, i = 0) =>
  spy.mock.calls[i]![0] as Record<string, unknown>;

describe('notify — priorités', () => {
  it('erreur > avertissement > succès = info (0, valeur implicite de Mantine)', () => {
    const show = spyShow();
    notify.error('e');
    notify.warning('w');
    notify.success('s');
    notify.info('i');
    expect([0, 1, 2, 3].map((i) => payload(show, i).priority)).toEqual([2, 1, 0, 0]);
  });

  it('⚠️ loading à ÉGALITÉ avec erreur (ni en dessous, ni au-dessus)', () => {
    const show = spyShow();
    notify.loading('chargement');
    notify.error('e');
    expect(payload(show, 0).priority).toBe(payload(show, 1).priority);
  });

  it('une `priority` passée par l’appelant prime', () => {
    const show = spyShow();
    notify.error('e', undefined, { priority: 7 });
    notify.loading('l', { priority: -1 });
    expect(payload(show, 0).priority).toBe(7);
    expect(payload(show, 1).priority).toBe(-1);
  });
});

describe('notify.resolve — trois issues', () => {
  it('true → succès, priorité 0, role status', () => {
    const upd = spyUpdate();
    notify.resolve('op-1', true, 'ok');
    expect(payload(upd)).toMatchObject({
      id: 'op-1', color: 'succes', role: 'status', priority: 0, autoClose: 3000, loading: false, withCloseButton: true,
    });
  });

  it('false → erreur, priorité 2, role alert', () => {
    const upd = spyUpdate();
    notify.resolve('op-2', false, 'ko');
    expect(payload(upd)).toMatchObject({ color: 'erreur', role: 'alert', priority: 2, autoClose: 8000 });
  });

  it("'warning' → avertissement, priorité 1, role alert, autoClose 5 s", () => {
    const upd = spyUpdate();
    notify.resolve('op-3', 'warning', 'partiel');
    expect(payload(upd)).toMatchObject({
      id: 'op-3', color: 'alerte', role: 'alert', priority: 1, autoClose: 5000, loading: false,
    });
    expect(payload(upd).icon).toBeTruthy();
  });

  it('les couleurs configurées s’appliquent aux trois issues', () => {
    configureNotify({ colors: { success: 'vert', error: 'brique', warning: 'ambre' } });
    const upd = spyUpdate();
    notify.resolve('a', true, '');
    notify.resolve('b', false, '');
    notify.resolve('c', 'warning', '');
    expect([0, 1, 2].map((i) => payload(upd, i).color)).toEqual(['vert', 'brique', 'ambre']);
  });
});

describe('notify.promise', () => {
  it('succès : loading puis resolve(true), retourne la promesse d’origine', async () => {
    const show = spyShow();
    const update = spyUpdate();
    const p = Promise.resolve(42);
    const r = notify.promise(p, { loading: 'en cours', success: 'ok' });
    expect(r).toBe(p);
    expect(payload(show).loading).toBe(true);
    await r;
    await Promise.resolve();
    expect(payload(update)).toMatchObject({ message: 'ok', loading: false, role: 'status' });
    expect(payload(update).id).toBe(payload(show).id);
  });

  it('success et error acceptent une fonction', async () => {
    const update = spyUpdate();
    spyShow();
    await notify.promise(Promise.resolve(3), { loading: 'l', success: (n) => `n=${n}` });
    await Promise.resolve();
    expect(payload(update, 0).message).toBe('n=3');
    const boom = new Error('x');
    await notify.promise(Promise.reject(boom), { loading: 'l', success: 's', error: (e) => `KO ${(e as Error).message}` }).catch(() => {});
    await Promise.resolve();
    expect(payload(update, 1)).toMatchObject({ message: 'KO x', role: 'alert', priority: 2 });
  });

  it('erreur : message par défaut via errorMessage, rejet conservé pour l’appelant', async () => {
    const update = spyUpdate();
    spyShow();
    const err = { response: { data: { error: 'refusé' } } };
    await expect(notify.promise(Promise.reject(err), { loading: 'l', success: 's' })).rejects.toBe(err);
    await Promise.resolve();
    expect(payload(update).message).toBe('refusé');
    await expect(notify.promise(Promise.reject(new Error('z')), { loading: 'l', success: 's' })).rejects.toThrow('z');
    await Promise.resolve();
    expect(payload(update, 1).message).toBe('Une erreur est survenue');
  });

  it('⚠️ aucun unhandled rejection si l’appelant ignore la promesse', async () => {
    spyShow();
    spyUpdate();
    const seen: unknown[] = [];
    const h = (e: unknown) => seen.push(e);
    process.on('unhandledRejection', h);
    notify.promise(Promise.reject(new Error('ignoré')), { loading: 'l', success: 's' });
    await new Promise((r) => setTimeout(r, 20));
    process.off('unhandledRejection', h);
    expect(seen).toEqual([]);
  });
});
