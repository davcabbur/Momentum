import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { HistorialScreen } from '@/ui/HistorialScreen';

export default function HistorialRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <HistorialScreen />
    </SafeAreaView>
  );
}
