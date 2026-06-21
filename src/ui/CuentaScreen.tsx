import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { resetPassword, signInEmail, signInWithGoogle, signUpEmail } from '@/auth/auth';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

export function CuentaScreen({ gate = false }: { gate?: boolean }) {
  const router = useRouter();
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || pass.length < 6) {
      Alert.alert('Datos incompletos', 'Introduce un email y una contraseña de al menos 6 caracteres.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error, needsConfirm } = await signUpEmail(email, pass);
        if (error) return Alert.alert('No se pudo registrar', error.message);
        if (needsConfirm) {
          Alert.alert('Casi listo', 'Te hemos enviado un correo para confirmar tu cuenta. Confírmalo y vuelve a iniciar sesión.');
          setMode('login');
          return;
        }
      } else {
        const { error } = await signInEmail(email, pass);
        if (error) return Alert.alert('No se pudo entrar', error.message);
      }
      if (!gate) router.back();
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) Alert.alert('Google', error.message);
      else if (!gate) router.back();
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email.trim()) return Alert.alert('Email', 'Escribe tu email arriba y vuelve a pulsar.');
    const { error } = await resetPassword(email);
    Alert.alert(error ? 'Error' : 'Listo', error ? error.message : 'Te hemos enviado un correo para restablecer la contraseña.');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {!gate && (
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backRow}>
          <Ionicons name="chevron-back" size={22} color={c.accent} />
          <Text style={styles.back}>Ajustes</Text>
        </Pressable>
      )}
      <View style={styles.header}>
        <Image source={require('../../assets/images/android-icon-foreground.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brand}>Momentum</Text>
        <Text style={styles.h1}>{mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
        <Text style={styles.note}>Guarda tus entrenos y tu peso en tu cuenta y recupéralos en cualquier móvil.</Text>
      </View>

      <Text style={styles.lbl}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="tu@email.com"
        placeholderTextColor={c.textMuted}
        style={styles.input}
      />
      <Text style={styles.lbl}>Contraseña</Text>
      <TextInput value={pass} onChangeText={setPass} secureTextEntry placeholder="······" placeholderTextColor={c.textMuted} style={styles.input} />

      <Pressable style={[styles.primary, busy && styles.off]} disabled={busy} onPress={submit}>
        <Text style={styles.primaryTxt}>{mode === 'signup' ? 'Registrarme' : 'Entrar'}</Text>
      </Pressable>
      <Pressable style={[styles.google, busy && styles.off]} disabled={busy} onPress={google}>
        <Ionicons name="logo-google" size={18} color={c.text} />
        <Text style={styles.googleTxt}>Continuar con Google</Text>
      </Pressable>

      <Pressable onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
        <Text style={styles.link}>{mode === 'signup' ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}</Text>
      </Pressable>
      {mode === 'login' && (
        <Pressable onPress={forgot}>
          <Text style={styles.link}>¿Olvidaste la contraseña?</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface },
    content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 8 },
    backRow: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 8, left: 8 },
    back: { color: c.accent, fontWeight: '700', fontSize: 15 },
    header: { alignItems: 'center', gap: 4, marginBottom: 12 },
    logo: { width: 92, height: 92 },
    brand: { color: c.accent, fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
    h1: { color: c.text, fontSize: 22, fontWeight: '800', marginTop: 6, textAlign: 'center' },
    note: { color: c.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 8 },
    lbl: { color: c.textMuted, fontSize: 12, marginTop: 8 },
    input: { color: c.text, fontSize: 16, fontWeight: '600', backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginTop: 4 },
    primary: { backgroundColor: c.accentStrong, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
    primaryTxt: { color: c.onAccent, fontWeight: '800', fontSize: 15 },
    off: { opacity: 0.5 },
    google: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 12, paddingVertical: 13, marginTop: 10 },
    googleTxt: { color: c.text, fontWeight: '700' },
    link: { color: c.accent, fontWeight: '700', fontSize: 13, textAlign: 'center', marginTop: 14 },
  });
