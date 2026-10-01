import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typography } from '../../theme';

type Props = TextProps & { variant?: keyof typeof typography; color?: keyof typeof colors };

export function AppText({ variant = 'body', color = 'text', style, ...rest }: Props) {
  return <Text {...rest} style={[typography[variant] as TextStyle, { color: colors[color] }, style]} />;
}