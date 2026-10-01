import { useRouter } from 'expo-router';
import { ShoppingCart } from 'lucide-react-native';
import { EmptyState, Screen, ScreenHeader } from '../../components/ui';

export default function Cart() {
  const router = useRouter();
  return (
    <Screen>
      <ScreenHeader title="Cart" />
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        message="Add gas or water to your cart to get started."
        actionLabel="Browse products"
        onAction={() => router.push('/products')}
      />
    </Screen>
  );
}