import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  imageUri?: string;
  useLocalAsset?: boolean;
}

export function SplashScreen({ imageUri, useLocalAsset = false }: SplashScreenProps) {
  const logoSize = Math.min(width * 0.6, 300);

  return (
    <View style={styles.container}>
      <Svg width={logoSize} height={logoSize} viewBox="0 0 300 300">
        <Path d="M 80 60 L 120 60 L 120 240 L 80 240 Z" fill="#FFFFFF" />
        <Path d="M 80 60 L 70 70 L 70 250 L 80 240 Z" fill="#E0E0E0" />
        <Path d="M 120 60 L 220 60 L 220 100 L 120 100 Z" fill="#FFFFFF" />
        <Path d="M 220 60 L 230 70 L 230 110 L 220 100 Z" fill="#E0E0E0" />
        <Path d="M 120 140 L 180 140 L 180 180 L 120 180 Z" fill="#FFFFFF" />
        <Path d="M 180 140 L 190 150 L 190 190 L 180 180 Z" fill="#E0E0E0" />
        <Path d="M 120 60 L 120 100 L 110 90 L 110 70 Z" fill="#000000" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

