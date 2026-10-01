import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme';
import { AppText } from './AppText';

export type TextFieldProps = TextInputProps & { label: string; error?: string; hint?: string; secure?: boolean };

export function TextField({ label, error, hint, secure, style, ...rest }: TextFieldProps) {
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={styles.wrap}>
      <AppText variant="label">{label}</AppText>
      <View style={[styles.field, !!error && styles.fieldError]}>
        <TextInput
          {...rest}
          accessibilityLabel={label}
          secureTextEntry={hidden}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={8}
          >
            {hidden ? <Eye size={20} color={colors.textMuted} /> : <EyeOff size={20} color={colors.textMuted} />}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="small" color="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="small" color="textMuted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  fieldError: { borderColor: colors.danger },
  input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: spacing.sm },
});