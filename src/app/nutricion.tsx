import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { NutricionScreen } from '@/ui/NutricionScreen';

export default function NutricionRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <NutricionScreen />
    </SafeAreaView>
  );
}
