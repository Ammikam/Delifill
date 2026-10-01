import { Pressable, StyleSheet, View } from 'react-native';
import { formatKes } from '../../lib/format';
import { colors, radius, spacing } from '../../theme';
import { AppText } from './AppText';
import { StatusBadge } from './StatusBadge';

type Props = { title: string; subtitle?: string; price: number; unavailable?: boolean; onPress: () => void };

export function ProductCard({ title, subtitle, price, unavailable, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${formatKes(price)}${unavailable ? ', out of stock' : ''}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.info}>
        <AppText variant="heading" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" color="textMuted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.right}>
        <AppText variant="heading">{formatKes(price)}</AppText>
        {unavailable ? <StatusBadge label="Out of stock" tone="danger" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  pressed: { backgroundColor: colors.surface },
  info: { flex: 1, gap: spacing.xs },
  right: { alignItems: 'flex-end', gap: spacing.xs },
});