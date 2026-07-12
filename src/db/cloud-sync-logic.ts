export type ReconcileAction = 'push' | 'pull' | 'ask' | 'replace' | 'reset' | 'none';

/**
 * Decide qué hacer al iniciar sesión, según haya datos en el móvil y/o en la nube.
 * `foreignOwner`: los datos locales pertenecen a OTRA cuenta (otro usuario usó este
 * móvil antes). En ese caso nunca se adoptan ni se suben — se reemplazan por los de
 * la nube del que entra, o se empieza de cero si su cuenta está vacía.
 */
export function reconcileDecision(input: { localHasData: boolean; remoteExists: boolean; foreignOwner?: boolean }): ReconcileAction {
  const { localHasData, remoteExists, foreignOwner = false } = input;
  if (localHasData && foreignOwner) return remoteExists ? 'replace' : 'reset';
  if (remoteExists && localHasData) return 'ask';
  if (remoteExists) return 'pull';
  if (localHasData) return 'push';
  return 'none';
}
