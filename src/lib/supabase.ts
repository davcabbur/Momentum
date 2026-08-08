import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// La anon key es PÚBLICA y segura para incrustar en la app: la protección la dan las
// políticas RLS de Supabase (cada usuario solo accede a su propia fila). NO usar la service_role aquí.
const SUPABASE_URL = 'https://xjnhhcynawlfebzqdaet.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbmhoY3luYXdsZmVienFkYWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMjcxNzAsImV4cCI6MjA5NzYwMzE3MH0.3qqr6TEdEBZRWoRKr1Wzqrbept2jVYbms30qqFAk4zs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // En web (PWA) el login con Google vuelve a la propia app con el `code` en la
    // URL, y es supabase-js quien lo canjea por la sesión. En nativo el canje lo
    // hace a mano signInWithGoogle(), así que ahí sobra.
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});
