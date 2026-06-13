import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { ProgresoScreen } from '@/ui/ProgresoScreen';

export default function ProgresoRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.surface }} edges={['top']}>
      <ProgresoScreen />
    </SafeAreaView>
  );
}
