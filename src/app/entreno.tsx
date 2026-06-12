import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { EntrenoScreen } from '@/ui/EntrenoScreen';

export default function EntrenoRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.surface }} edges={['top']}>
      <EntrenoScreen />
    </SafeAreaView>
  );
}
