import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from '@/lib/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resetPassword, signInEmail, signInWithGoogle, signUpEmail } from '@/auth/auth';
import { forgetEmail, getRememberedEmail, rememberEmail } from '@/auth/remembered-account';
import { translateAuthError } from '@/lib/auth-errors';
import { GoogleG } from '@/ui/GoogleG';
import { useTheme, useThemedStyles, type Theme } from '@/ui/theme';

/**
 * Login/registro (pantalla de entrada). Diseño del handoff de marca. Email + Google.
 *
 * Si ya se entró antes en este dispositivo, la cuenta se recuerda y solo se pide la
 * contraseña: un campo y dentro. El correo no se pierde de vista —se muestra— y hay una
 * salida para usar otro, que es lo que hace que esto no sea una jaula.
 */
export function CuentaScreen() {
  const { c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [focus, setFocus] = useState<'email' | 'pass' | null>(null);
  const [busy, setBusy] = useState(false);

  // Cuenta recordada: null mientras se lee, '' si no hay ninguna.
  const [remembered, setRemembered] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getRememberedEmail().then((value) => {
      if (!alive) return;
      setRemembered(value ?? '');
      if (value) setEmail(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  /** Con la cuenta recordada solo se pide la contraseña (y nunca al registrarse). */
  const soloPass = mode === 'login' && !!remembered;

  async function usarOtroCorreo() {
    await forgetEmail();
    setRemembered('');
    setEmail('');
    setPass('');
  }

  async function submit() {
    if (!email.trim() || pass.length < 6) {
      Alert.alert(
        'Datos incompletos',
        soloPass ? 'Escribe tu contraseña (al menos 6 caracteres).' : 'Introduce un correo y una contraseña de al menos 6 caracteres.',
      );
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error, needsConfirm } = await signUpEmail(email, pass);
        if (error) return Alert.alert('No se pudo registrar', translateAuthError(error));
        if (needsConfirm) {
          Alert.alert('Casi listo', 'Te hemos enviado un correo para confirmar tu cuenta. Confírmalo y vuelve a iniciar sesión.');
          setMode('login');
        }
      } else {
        const { error } = await signInEmail(email, pass);
        if (error) Alert.alert('No se pudo entrar', translateAuthError(error));
        // Solo se recuerda lo que ha funcionado: guardar un correo con el que no se
        // puede entrar dejaría la pantalla de un campo pidiendo lo imposible.
        else await rememberEmail(email);
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
      if (error) Alert.alert('No se pudo entrar con Google', translateAuthError(error));
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email.trim()) return Alert.alert('Correo', 'Escribe tu correo arriba y vuelve a pulsar.');
    const { error } = await resetPassword(email);
    Alert.alert(error ? 'Error' : 'Listo', error ? translateAuthError(error) : 'Te hemos enviado un correo para restablecer la contraseña.');
  }

  const signup = mode === 'signup';
  const borderFor = (f: 'email' | 'pass') => (focus === f ? c.accentStrong : c.cardBorder);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.main}>
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

        {soloPass ? (
          <View style={styles.accountRow}>
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Tu cuenta</Text>
              <Text style={styles.accountEmail} numberOfLines={1}>
                {remembered}
              </Text>
            </View>
            <Pressable onPress={usarOtroCorreo} hitSlop={8}>
              <Text style={styles.accountSwap}>Cambiar</Text>
            </Pressable>
          </View>
        ) : (
          <>
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
          </>
        )}

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          value={pass}
          onChangeText={setPass}
          onFocus={() => setFocus('pass')}
          onBlur={() => setFocus(null)}
          secureTextEntry
          // Con la cuenta ya puesta, el foco va directo a lo único que falta.
          autoFocus={soloPass}
          // Que iOS y el gestor de contraseñas sepan qué es esto y lo ofrezcan solo.
          textContentType={signup ? 'newPassword' : 'password'}
          autoComplete={signup ? 'new-password' : 'current-password'}
          returnKeyType="go"
          onSubmitEditing={() => {
            if (!busy) submit();
          }}
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
          <GoogleG size={18} />
          <Text style={styles.socialTxt}>Google</Text>
        </Pressable>
      </View>

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
    content: { flexGrow: 1, paddingHorizontal: 28 },
    main: { flex: 1, justifyContent: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
    tile: { width: 46, height: 46, borderRadius: 13 },
    brand: { color: c.text, fontSize: 20, fontWeight: '700', letterSpacing: 0.3 },
    title: { color: c.text, fontSize: 30, fontWeight: '800' },
    subtitle: { color: c.textMuted, fontSize: 15, lineHeight: 21, marginTop: 8 },
    label: { color: c.textMuted, fontSize: 13, fontWeight: '600', marginTop: 18, marginBottom: 6 },
    input: { height: 52, backgroundColor: c.card, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, color: c.text, fontSize: 15 },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 20,
      backgroundColor: c.card,
      borderColor: c.cardBorder,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    accountInfo: { flex: 1 },
    accountLabel: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
    accountEmail: { color: c.text, fontSize: 15, fontWeight: '600', marginTop: 2 },
    accountSwap: { color: c.accent, fontSize: 13, fontWeight: '700' },
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
    footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 16 },
    footerTxt: { color: c.textMuted, fontSize: 13 },
    footerLink: { color: c.accent, fontSize: 13, fontWeight: '700' },
  });
