import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { resetPassword, signInEmail, signInWithGoogle, signUpEmail } from '@/auth/auth';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

/** Login/registro (pantalla de entrada). Diseño del handoff de marca. Email + Google. */
export function CuentaScreen() {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [focus, setFocus] = useState<'email' | 'pass' | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || pass.length < 6) {
      Alert.alert('Datos incompletos', 'Introduce un correo y una contraseña de al menos 6 caracteres.');
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
        }
      } else {
        const { error } = await signInEmail(email, pass);
        if (error) Alert.alert('No se pudo entrar', error.message);
      }
      // Si va bien, la sesión cambia y la "puerta" muestra la app automáticamente.
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) Alert.alert('Google', error.message);
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email.trim()) return Alert.alert('Correo', 'Escribe tu correo arriba y vuelve a pulsar.');
    const { error } = await resetPassword(email);
    Alert.alert(error ? 'Error' : 'Listo', error ? error.message : 'Te hemos enviado un correo para restablecer la contraseña.');
  }

  const signup = mode === 'signup';
  const borderFor = (f: 'email' | 'pass') => (focus === f ? c.accentStrong : c.cardBorder);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Image source={require('../../assets/images/icon.png')} style={styles.tile} resizeMode="cover" />
        <Text style={styles.brand}>Momentum</Text>
      </View>

      <Text style={styles.title}>{signup ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}</Text>
      <Text style={styles.subtitle}>
        {signup
          ? 'Crea tu cuenta para guardar tu progreso y recuperarlo en cualquier móvil.'
          : 'Retoma tu progreso donde lo dejaste. Tu entrenador te espera.'}
      </Text>

      <Text style={styles.label}>Correo</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        onFocus={() => setFocus('email')}
        onBlur={() => setFocus(null)}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="tu@correo.com"
        placeholderTextColor={c.textMuted}
        style={[styles.input, { borderColor: borderFor('email') }]}
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        value={pass}
        onChangeText={setPass}
        onFocus={() => setFocus('pass')}
        onBlur={() => setFocus(null)}
        secureTextEntry
        placeholder="········"
        placeholderTextColor={c.textMuted}
        style={[styles.input, { borderColor: borderFor('pass') }]}
      />

      {!signup && (
        <Pressable style={styles.forgot} onPress={forgot}>
          <Text style={styles.forgotTxt}>¿Olvidaste tu contraseña?</Text>
        </Pressable>
      )}

      <Pressable style={[styles.primary, busy && styles.off]} disabled={busy} onPress={submit}>
        <Text style={styles.primaryTxt}>{signup ? 'Crear cuenta' : 'Entrar'}</Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.dividerTxt}>o continúa con</Text>
        <View style={styles.line} />
      </View>

      <Pressable style={[styles.social, busy && styles.off]} disabled={busy} onPress={google}>
        <Ionicons name="logo-google" size={18} color={c.text} />
        <Text style={styles.socialTxt}>Google</Text>
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={styles.footerTxt}>{signup ? '¿Ya tienes cuenta? ' : '¿Aún no tienes cuenta? '}</Text>
        <Pressable onPress={() => setMode(signup ? 'login' : 'signup')}>
          <Text style={styles.footerLink}>{signup ? 'Inicia sesión' : 'Crear cuenta'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.surface },
    content: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 32 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22 },
    tile: { width: 46, height: 46, borderRadius: 13 },
    brand: { color: c.text, fontSize: 20, fontWeight: '700', letterSpacing: 0.3 },
    title: { color: c.text, fontSize: 30, fontWeight: '800' },
    subtitle: { color: c.textMuted, fontSize: 15, lineHeight: 21, marginTop: 8 },
    label: { color: c.textMuted, fontSize: 13, fontWeight: '600', marginTop: 18, marginBottom: 6 },
    input: { height: 52, backgroundColor: c.card, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, color: c.text, fontSize: 15 },
    forgot: { alignSelf: 'flex-end', marginTop: 10 },
    forgotTxt: { color: c.accent, fontSize: 13, fontWeight: '700' },
    primary: {
      height: 54,
      backgroundColor: c.accentStrong,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 18,
      shadowColor: c.accentStrong,
      shadowOpacity: 0.45,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    primaryTxt: { color: c.onAccent, fontSize: 16, fontWeight: '700' },
    off: { opacity: 0.5 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
    line: { flex: 1, height: 1, backgroundColor: c.cardBorder },
    dividerTxt: { color: c.textMuted, fontSize: 12 },
    social: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.card, borderColor: c.cardBorder, borderWidth: 1, borderRadius: 14 },
    socialTxt: { color: c.text, fontSize: 14, fontWeight: '600' },
    footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
    footerTxt: { color: c.textMuted, fontSize: 13 },
    footerLink: { color: c.accent, fontSize: 13, fontWeight: '700' },
  });
