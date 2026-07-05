import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { CuentaAjustesScreen } from '@/ui/ajustes/CuentaAjustesScreen';

export default function CuentaRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <CuentaAjustesScreen />
    </SafeAreaView>
  );
}
