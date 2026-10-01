import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { TextField, type TextFieldProps } from './TextField';

type Props<T extends FieldValues> = Omit<TextFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error'> & {
  control: Control<T>;
  name: Path<T>;
};

export function FormField<T extends FieldValues>({ control, name, ...props }: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          value={String(field.value ?? '')}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}