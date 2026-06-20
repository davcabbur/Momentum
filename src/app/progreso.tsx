import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { ProgresoScreen } from '@/ui/ProgresoScreen';

export default function ProgresoRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <ProgresoScreen />
    </SafeAreaView>
  );
}
