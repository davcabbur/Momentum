import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { PerfilScreen } from '@/ui/ajustes/PerfilScreen';

export default function PerfilRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <PerfilScreen />
    </SafeAreaView>
  );
}
