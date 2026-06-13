import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { NutricionScreen } from '@/ui/NutricionScreen';

export default function NutricionRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.surface }} edges={['top']}>
      <NutricionScreen />
    </SafeAreaView>
  );
}
