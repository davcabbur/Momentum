import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { AjustesScreen } from '@/ui/AjustesScreen';

export default function AjustesRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <AjustesScreen />
    </SafeAreaView>
  );
}
