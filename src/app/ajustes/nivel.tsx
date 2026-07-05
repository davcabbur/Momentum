import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { NivelScreen } from '@/ui/ajustes/NivelScreen';

export default function NivelRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <NivelScreen />
    </SafeAreaView>
  );
}
