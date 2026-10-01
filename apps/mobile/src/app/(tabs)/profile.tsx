import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CircleAlert, CircleCheck, LogOut } from 'lucide-react-native';
import { AppText, ConfirmModal, ListRow, Screen, ScreenHeader } from '../../components/ui';
import { signOut } from '../../features/auth/session';
import { fetchHealth } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { spacing } from '../../theme';

function ApiStatusRow() {
  const { data, error, isLoading } = useQuery({ queryKey: ['health'], queryFn: fetchHealth, retry: false });
  const text = isLoading ? 'Checking' : error ? 'Unreachable' : `${data?.status}, database ${data?.database}`;
  return (
    <ListRow
      icon={error ? CircleAlert : CircleCheck}
      title="API status (development)"
      subtitle={text}
    />
  );
}

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const [confirming, setConfirming] = useState(false);

  return (
    <Screen scroll>
      <ScreenHeader title="Profile" />
      <View style={{ marginTop: spacing.xl, marginBottom: spacing.lg, gap: spacing.xs }}>
        <AppText variant="heading">{user?.fullName}</AppText>
        <AppText color="textMuted">{user?.phone}</AppText>
        {user?.email ? <AppText color="textMuted">{user.email}</AppText> : null}
      </View>
      <ListRow icon={LogOut} title="Sign out" destructive onPress={() => setConfirming(true)} />
      {__DEV__ ? <ApiStatusRow /> : null}
      <ConfirmModal
        visible={confirming}
        title="Sign out?"
        message="You will need to sign in again to place orders."
        confirmLabel="Sign out"
        destructive
        onCancel={() => setConfirming(false)}
        onConfirm={async () => {
          setConfirming(false);
          await signOut();
        }}
      />
    </Screen>
  );
}