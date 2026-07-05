import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { ObjetivoScreen } from '@/ui/ajustes/ObjetivoScreen';

export default function ObjetivoRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <ObjetivoScreen />
    </SafeAreaView>
  );
}
