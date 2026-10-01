import { Package } from 'lucide-react-native';
import { EmptyState, Screen, ScreenHeader } from '../../components/ui';

export default function Products() {
  return (
    <Screen>
      <ScreenHeader title="Products" />
      <EmptyState icon={Package} title="No products to show yet" message="Gas and water products from suppliers will be listed here." />
    </Screen>
  );
}