import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { WeightScreen } from '@/ui/WeightScreen';

export default function HomeScreen() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <WeightScreen />
    </SafeAreaView>
  );
}
