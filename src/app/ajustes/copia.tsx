import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { CopiaScreen } from '@/ui/ajustes/CopiaScreen';

export default function CopiaRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <CopiaScreen />
    </SafeAreaView>
  );
}
