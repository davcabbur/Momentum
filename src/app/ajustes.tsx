import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { AjustesScreen } from '@/ui/AjustesScreen';

export default function AjustesRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.surface }} edges={['top']}>
      <AjustesScreen />
    </SafeAreaView>
  );
}
