import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Droplets, Flame } from 'lucide-react-native';
import { AppText, ListRow, Screen, ScreenHeader } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { spacing } from '../../theme';

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.fullName.split(' ')[0] ?? '';

  return (
    <Screen scroll>
      <ScreenHeader title={`Hello, ${firstName}`} subtitle="What do you need delivered?" />
      <View style={{ marginTop: spacing.xl }}>
        <AppText variant="heading">Browse</AppText>
        <ListRow icon={Flame} title="Cooking gas" subtitle="Refills, exchanges and new cylinders" onPress={() => router.push('/products')} />
        <ListRow icon={Droplets} title="Drinking water" subtitle="Refills, exchanges and new containers" onPress={() => router.push('/products')} />
      </View>
    </Screen>
  );
}