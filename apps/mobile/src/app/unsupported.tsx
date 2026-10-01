import { UserX } from 'lucide-react-native';
import { Button, EmptyState, Screen } from '../components/ui';
import { signOut } from '../features/auth/session';

export default function Unsupported() {
  return (
    <Screen>
      <EmptyState
        icon={UserX}
        title="This account type isn't available in the app yet"
        message="The Delifill app currently supports customer accounts. Supplier and driver tools are coming soon."
      />
      <Button title="Sign out" variant="secondary" onPress={() => signOut()} />
    </Screen>
  );
}