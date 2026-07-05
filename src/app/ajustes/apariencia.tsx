import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { AparienciaScreen } from '@/ui/ajustes/AparienciaScreen';

export default function AparienciaRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <AparienciaScreen />
    </SafeAreaView>
  );
}
