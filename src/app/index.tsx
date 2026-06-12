import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { WeightScreen } from '@/ui/WeightScreen';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.surface }} edges={['top']}>
      <WeightScreen />
    </SafeAreaView>
  );
}
