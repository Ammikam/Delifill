import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppText, Button, FormField, Screen } from '../../components/ui';
import { signIn } from '../../features/auth/session';
import { getErrorMessage } from '../../lib/api';
import { loginSchema, type LoginForm } from '../../lib/validation';
import { spacing } from '../../theme';

export default function Login() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { phone: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signIn(values.phone, values.password);
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  });

  return (
    <Screen scroll edges={['top', 'bottom', 'left', 'right']}>
      <View style={{ gap: spacing.xl, paddingTop: spacing.xxl }}>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="title">Delifill</AppText>
          <AppText color="textMuted">Sign in to order gas and water.</AppText>
        </View>
        <View style={{ gap: spacing.lg }}>
          <FormField control={control} name="phone" label="Phone number" placeholder="0712 345 678" keyboardType="phone-pad" autoComplete="tel" />
          <FormField control={control} name="password" label="Password" secure autoCapitalize="none" autoComplete="current-password" />
          {formError ? (
            <AppText color="danger" accessibilityLiveRegion="polite">
              {formError}
            </AppText>
          ) : null}
          <Button title="Sign in" onPress={onSubmit} loading={isSubmitting} />
        </View>
        <View style={{ gap: spacing.sm }}>
          <AppText color="textMuted">New to Delifill?</AppText>
          <Button title="Create an account" variant="secondary" onPress={() => router.push('/register')} />
        </View>
      </View>
    </Screen>
  );
}