import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppText, Button, FormField, ScreenHeader, Screen } from '../../components/ui';
import { registerCustomer } from '../../features/auth/session';
import { getErrorMessage } from '../../lib/api';
import { registerSchema, type RegisterForm } from '../../lib/validation';
import { spacing } from '../../theme';

export default function Register() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', phone: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await registerCustomer({
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        password: values.password,
      });
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  });

  return (
    <Screen scroll edges={['top', 'bottom', 'left', 'right']}>
      <View style={{ gap: spacing.xl }}>
        <ScreenHeader title="Create account" onBack={() => router.back()} />
        <View style={{ gap: spacing.lg }}>
          <FormField control={control} name="fullName" label="Full name" autoComplete="name" autoCapitalize="words" />
          <FormField control={control} name="phone" label="Phone number" placeholder="0712 345 678" keyboardType="phone-pad" autoComplete="tel" />
          <FormField control={control} name="email" label="Email (optional)" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <FormField control={control} name="password" label="Password" secure autoCapitalize="none" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." />
          {formError ? (
            <AppText color="danger" accessibilityLiveRegion="polite">
              {formError}
            </AppText>
          ) : null}
          <Button title="Create account" onPress={onSubmit} loading={isSubmitting} />
        </View>
      </View>
    </Screen>
  );
}