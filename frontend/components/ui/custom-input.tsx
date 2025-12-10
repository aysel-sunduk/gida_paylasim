import { useThemeColor } from '@/hooks/use-theme-color';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

export type CustomInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
  placeholderColor?: string;
};

export function CustomInput({
  style,
  lightColor,
  darkColor,
  placeholderColor,
  ...rest
}: CustomInputProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#FFF' }, 'text');
  const placeColor = useThemeColor({ light: placeholderColor || '#999', dark: placeholderColor || '#666' }, 'text');

  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor,
          color: textColor,
        },
        style,
      ]}
      placeholderTextColor={placeColor}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginVertical: 8,
    fontSize: 16,
  },
});
