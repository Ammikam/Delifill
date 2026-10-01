import { Modal, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { AppText } from './AppText';
import { Button } from './Button';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({ visible, title, message, confirmLabel, cancelLabel = 'Cancel', destructive, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <AppText variant="heading">{title}</AppText>
          <AppText color="textMuted">{message}</AppText>
          <View style={styles.actions}>
            <Button title={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} />
            <Button title={cancelLabel} variant="secondary" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.xl },
  dialog: { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.xl, gap: spacing.md },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});