import { StyleSheet, TouchableOpacity, type TouchableOpacityProps } from 'react-native';
import { ThemedText } from '../themed-text';

export type PrimaryButtonProps = TouchableOpacityProps & {
  title: string;
  onPress: () => void;
};

export function PrimaryButton({ title, onPress, style, ...rest }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      {...rest}
    >
      <ThemedText style={styles.text}>{title}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  text: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
