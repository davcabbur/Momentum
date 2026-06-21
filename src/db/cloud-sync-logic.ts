export type ReconcileAction = 'push' | 'pull' | 'ask' | 'none';

/** Decide qué hacer al iniciar sesión, según haya datos en el móvil y/o en la nube. */
export function reconcileDecision(input: { localHasData: boolean; remoteExists: boolean }): ReconcileAction {
  const { localHasData, remoteExists } = input;
  if (remoteExists && localHasData) return 'ask';
  if (remoteExists) return 'pull';
  if (localHasData) return 'push';
  return 'none';
}
