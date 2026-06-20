import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { EntrenoScreen } from '@/ui/EntrenoScreen';

export default function EntrenoRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <EntrenoScreen />
    </SafeAreaView>
  );
}
