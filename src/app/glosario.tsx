import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { GlosarioScreen } from '@/ui/GlosarioScreen';

export default function GlosarioRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <GlosarioScreen />
    </SafeAreaView>
  );
}
