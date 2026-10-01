import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { AppText } from './AppText';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<Tone, { bg: string; fg: keyof typeof colors }> = {
  neutral: { bg: colors.surface, fg: 'textMuted' },
  success: { bg: colors.successSurface, fg: 'success' },
  warning: { bg: colors.warningSurface, fg: 'warning' },
  danger: { bg: colors.dangerSurface, fg: 'danger' },
  info: { bg: colors.infoSurface, fg: 'info' },
};

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <AppText variant="small" color={t.fg} style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

export type OrderStatus =
  | 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY'
  | 'DELIVERED' | 'REJECTED' | 'CANCELLED' | 'FAILED_DELIVERY';

const orderStatuses: Record<OrderStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Pending', tone: 'warning' },
  ACCEPTED: { label: 'Accepted', tone: 'info' },
  PREPARING: { label: 'Preparing', tone: 'info' },
  READY: { label: 'Ready', tone: 'info' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', tone: 'info' },
  DELIVERED: { label: 'Delivered', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  FAILED_DELIVERY: { label: 'Delivery failed', tone: 'danger' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <StatusBadge {...orderStatuses[status]} />;
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  label: { fontWeight: '500' },
});