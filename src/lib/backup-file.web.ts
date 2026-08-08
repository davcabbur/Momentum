/**
 * Versión web de `backup-file.ts` (Metro elige este archivo al compilar para web).
 *
 * expo-file-system, expo-sharing y expo-document-picker no funcionan en el navegador,
 * pero el navegador ya sabe hacer esto: descargar un fichero y dejar elegir otro. En
 * el iPhone, la descarga acaba en Archivos y el selector deja tirar de iCloud Drive,
 * así que la copia se puede guardar y restaurar igual que en Android.
 */

/** Descarga el JSON como fichero. */
export async function shareBackup(json: string, filename: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Safari necesita que el blob siga vivo mientras arranca la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Abre el selector de archivos y devuelve el contenido como texto (null si se cancela). */
export async function pickBackupJson(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    // Safari filtra fatal por MIME con los .json de otra app, así que se acepta también
    // la extensión a secas.
    input.accept = 'application/json,.json';
    input.style.display = 'none';

    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(value);
    };

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return finish(null);
      file
        .text()
        .then(finish)
        .catch(() => finish(null));
    });

    // Safari en iOS no dispara `cancel` de forma fiable; si el usuario cierra el
    // selector sin elegir nada, esto evita quedarse esperando una promesa para siempre.
    input.addEventListener('cancel', () => finish(null));
    window.addEventListener('focus', () => setTimeout(() => { if (!input.files?.length) finish(null); }, 1000), {
      once: true,
    });

    document.body.appendChild(input);
    input.click();
  });
}
