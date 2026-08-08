import { Alert as RNAlert } from 'react-native';

export type AlertButton = {
  text?: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type AlertOptions = { cancelable?: boolean };

/**
 * Avisos y confirmaciones de la app.
 *
 * En nativo es el `Alert` de React Native tal cual. Existe este módulo por la versión
 * web: allí `Alert.alert` de react-native-web es una función VACÍA (literalmente
 * `static alert() {}`), así que cualquier mensaje desaparece sin dejar rastro — y con él
 * el motivo de que algo no haya funcionado. Ver `alert.web.ts`.
 *
 * Usar SIEMPRE este módulo, nunca `Alert` de 'react-native' directamente.
 */
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions): void {
    RNAlert.alert(title, message, buttons, options);
  },
};
