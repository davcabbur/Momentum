import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { HistorialScreen } from '@/ui/HistorialScreen';

export default function HistorialRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.surface }} edges={['top']}>
      <HistorialScreen />
    </SafeAreaView>
  );
}
