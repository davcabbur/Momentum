import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { AcercaScreen } from '@/ui/ajustes/AcercaScreen';

export default function AcercaRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <AcercaScreen />
    </SafeAreaView>
  );
}
