import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { RecordatoriosScreen } from '@/ui/ajustes/RecordatoriosScreen';

export default function RecordatoriosRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <RecordatoriosScreen />
    </SafeAreaView>
  );
}
