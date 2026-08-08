import type { AlertButton, AlertOptions } from './alert';

/**
 * Versión web de `alert.ts` (Metro elige este archivo al compilar para web).
 *
 * `Alert.alert` de react-native-web no está implementado: es `static alert() {}`, una
 * función vacía. Con él, en la PWA no se veía ni un solo mensaje — ni los errores de
 * login ni las confirmaciones de borrar cuenta, que además dejaban de ejecutar su acción
 * porque el diálogo nunca aparecía. Aquí se usan los diálogos del navegador, que en el
 * iPhone se ven como los del sistema.
 *
 * Son bloqueantes, lo que en una app no es lo ideal, pero es infinitamente mejor que el
 * silencio: si algo falla, el usuario se entera.
 */

const join = (title: string, message?: string): string => (message ? `${title}\n\n${message}` : title);

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[], _options?: AlertOptions): void {
    const text = join(title, message);

    // Sin botones o con uno solo: es un aviso, no una pregunta.
    if (!buttons || buttons.length === 0) {
      window.alert(text);
      return;
    }
    if (buttons.length === 1) {
      window.alert(text);
      buttons[0].onPress?.();
      return;
    }

    if (buttons.length === 2) {
      const cancelIndex = buttons.findIndex((b) => b.style === 'cancel');
      if (cancelIndex !== -1) {
        // Caso normal: "Cancelar" + la acción. Aceptar ejecuta la acción.
        const action = buttons[cancelIndex === 0 ? 1 : 0];
        const cancel = buttons[cancelIndex];
        if (window.confirm(text)) action.onPress?.();
        else cancel.onPress?.();
        return;
      }
      // Dos opciones de verdad, ninguna es cancelar (p. ej. "usar los de la nube" o
      // "subir los de este móvil"). Con un confirm hay que decir qué hace cada botón,
      // porque "Cancelar" aquí NO significa no hacer nada.
      const [first, second] = buttons;
      const explained = `${text}\n\nAceptar: ${first.text ?? 'Sí'}\nCancelar: ${second.text ?? 'No'}`;
      if (window.confirm(explained)) first.onPress?.();
      else second.onPress?.();
      return;
    }

    // Tres o más: un confirm no da para tanto, así que se pregunta una por una y gana la
    // primera que se acepte. Las de cancelar no se ofrecen: son la salida si se rechaza todo.
    const choices = buttons.filter((b) => b.style !== 'cancel');
    for (const choice of choices) {
      if (window.confirm(`${text}\n\n¿${choice.text ?? 'Continuar'}?`)) {
        choice.onPress?.();
        return;
      }
    }
    buttons.find((b) => b.style === 'cancel')?.onPress?.();
  },
};
