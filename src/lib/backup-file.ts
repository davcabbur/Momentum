import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

/** Escribe el JSON en un fichero temporal y abre el diálogo para compartir/guardar. */
export async function shareBackup(json: string, filename: string): Promise<void> {
  const uri = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Guardar copia de Momentum' });
  }
}

/** Deja elegir un archivo y devuelve su contenido como texto (null si se cancela). */
export async function pickBackupJson(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.[0]) return null;
  return FileSystem.readAsStringAsync(res.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
}
