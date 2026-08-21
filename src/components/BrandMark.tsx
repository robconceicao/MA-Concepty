import { Image, StyleSheet, View, type ViewStyle } from 'react-native';

type Props = {
  variant?: 'wordmark' | 'monogram';
  width?: number;
  style?: ViewStyle;
};

/** Assinatura oficial da marca. */
export function BrandMark({ variant = 'wordmark', width = 150, style }: Props) {
  const source =
    variant === 'wordmark'
      ? require('../../assets/brand/logo-full-black.png')
      : require('../../assets/brand/monogram.png');
  const ratio = variant === 'wordmark' ? 432 / 1400 : 1;

  return (
    <View style={style}>
      <Image
        source={source}
        style={[styles.image, { width, height: width * ratio }]}
        resizeMode="contain"
        accessibilityLabel="MARCO Concept Beauty"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { alignSelf: 'flex-start' },
});
