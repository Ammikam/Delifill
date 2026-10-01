import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { colors, spacing } from '../../theme';
import { AppText } from './AppText';

type Props = {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  destructive?: boolean;
  trailing?: ReactNode;
};

export function ListRow({ icon: Icon, title, subtitle, onPress, destructive, trailing }: Props) {
  const color = destructive ? colors.danger : colors.text;
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {Icon ? <Icon size={22} color={destructive ? colors.danger : colors.textMuted} /> : null}
      <View style={styles.text}>
        <AppText style={{ color }}>{title}</AppText>
        {subtitle ? (
          <AppText variant="small" color="textMuted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
      {onPress && !destructive ? <ChevronRight size={20} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surface },
  text: { flex: 1, gap: 2 },
});