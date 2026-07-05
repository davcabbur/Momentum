import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { useSession } from '@/auth/AuthProvider';
import { deleteAccount, signOut } from '@/auth/auth';
import { clearAllData } from '@/db/backup';
import { getLastSync, pushSnapshot } from '@/db/cloud-sync';
import { formatDateTime } from '@/lib/datetime';
import { SettingHeader, useAjustesStyles } from '@/ui/ajustes/ui';

export function CuentaAjustesScreen() {
  const styles = useAjustesStyles();
  const { user } = useSession();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLastSync(await getLastSync());
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function syncNow() {
    if (!user) return;
    setSyncing(true);
    try {
      await pushSnapshot(user.id);
      setLastSync(await getLastSync());
      Alert.alert('Hecho', 'Tus datos se han guardado en tu cuenta.');
    } catch {
      Alert.alert('Sincronización', 'No se pudo sincronizar (¿sin conexión?).');
    } finally {
      setSyncing(false);
    }
  }

  async function cerrarSesion() {
    try {
      if (user) await pushSnapshot(user.id);
    } catch {
      /* sin conexión: cerramos igualmente */
    }
    await signOut();
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Borrar cuenta',
      'Se borrarán para siempre tu cuenta y todos tus datos, tanto en este móvil como en la nube (peso, entrenos, comidas y ajustes). Esto no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar cuenta',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              await clearAllData();
              await signOut();
            } catch (e) {
              Alert.alert('No se pudo borrar', String((e as Error)?.message ?? e));
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingHeader title="Cuenta" />
      <View style={styles.card}>
        <Text style={styles.note}>Sesión iniciada como {user?.email ?? '—'}. Tus datos se guardan en tu cuenta y se restauran al iniciar sesión.</Text>
        <Text style={styles.note}>Última sincronización: {lastSync ? formatDateTime(lastSync) : 'nunca en este móvil'}</Text>
        <Pressable style={[styles.save, syncing && { opacity: 0.5 }]} disabled={syncing} onPress={syncNow}>
          <Text style={styles.saveTxt}>{syncing ? 'Sincronizando…' : 'Sincronizar ahora'}</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={cerrarSesion}>
          <Text style={styles.secondaryTxt}>Cerrar sesión</Text>
        </Pressable>
        <Pressable style={styles.danger} onPress={confirmDeleteAccount}>
          <Text style={styles.dangerTxt}>Borrar cuenta</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
