import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';
import { AjustesMenu } from '@/ui/ajustes/AjustesMenu';

export default function AjustesIndexRoute() {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <AjustesMenu />
    </SafeAreaView>
  );
}
