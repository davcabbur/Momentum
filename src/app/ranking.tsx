import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { RankingScreen } from '@/ui/RankingScreen';

export default function RankingRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <RankingScreen />
    </SafeAreaView>
  );
}
