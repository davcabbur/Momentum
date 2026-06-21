import { SafeAreaView } from 'react-native-safe-area-context';

import { CuentaScreen } from '@/ui/CuentaScreen';
import { useTheme } from '@/ui/theme';

export default function CuentaRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <CuentaScreen />
    </SafeAreaView>
  );
}
