import { ClipboardList } from 'lucide-react-native';
import { EmptyState, Screen, ScreenHeader } from '../../components/ui';

export default function Orders() {
  return (
    <Screen>
      <ScreenHeader title="Orders" />
      <EmptyState icon={ClipboardList} title="No orders yet" message="Your orders and their delivery status will appear here." />
    </Screen>
  );
}