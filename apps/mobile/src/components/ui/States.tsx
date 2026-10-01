import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { CircleAlert, type LucideIcon } from 'lucide-react-native';
import { colors, spacing } from '../../theme';
import { AppText } from './AppText';
import { Button } from './Button';

export function LoadingState({ message }: { message?: string }) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.primary} />
      {message ? <AppText color="textMuted">{message}</AppText> : null}
    </View>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <CircleAlert size={32} color={colors.danger} />
      <AppText variant="heading">{title}</AppText>
      <AppText color="textMuted" style={styles.text}>
        {message}
      </AppText>
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Icon size={32} color={colors.textMuted} />
      <AppText variant="heading">{title}</AppText>
      <AppText color="textMuted" style={styles.text}>
        {message}
      </AppText>
      {actionLabel && onAction ? <Button title={actionLabel} variant="secondary" onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  text: { textAlign: 'center' },
});