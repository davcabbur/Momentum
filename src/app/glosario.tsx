import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { GlosarioScreen } from '@/ui/GlosarioScreen';

export default function GlosarioRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.surface }} edges={['top']}>
      <GlosarioScreen />
    </SafeAreaView>
  );
}
