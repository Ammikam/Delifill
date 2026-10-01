import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors, spacing } from '../../theme';
import { AppText } from './AppText';

type Props = { title: string; subtitle?: string; onBack?: () => void; right?: ReactNode };

export function ScreenHeader({ title, subtitle, onBack, right }: Props) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
      ) : null}
      <View style={styles.titles}>
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" color="textMuted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titles: { flex: 1, gap: spacing.xs },
});