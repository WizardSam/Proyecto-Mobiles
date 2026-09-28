import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/components/ui/theme';

export function RouteArt({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.scene, compact && styles.compact]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.sun} />
      <View style={styles.hillBack} />
      <View style={styles.hillFront} />
      <View style={styles.path} />
      <View style={styles.pin} />
      {compact ? null : (
        <View style={styles.sign}>
          <View style={styles.post} />
          <Text style={styles.signText}>PLANEA</Text>
          <Text style={styles.signText}>AHORRA</Text>
          <Text style={styles.signText}>LOGRA</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    height: 230,
    borderRadius: 28,
    backgroundColor: '#D7EFE4',
    overflow: 'hidden',
  },
  compact: {
    height: 92,
    borderRadius: 20,
  },
  sun: {
    position: 'absolute',
    top: 28,
    left: 36,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.yellow,
  },
  hillBack: {
    position: 'absolute',
    left: -20,
    right: 40,
    bottom: 18,
    height: 110,
    borderTopLeftRadius: 90,
    borderTopRightRadius: 70,
    backgroundColor: '#7EBF9E',
  },
  hillFront: {
    position: 'absolute',
    left: 50,
    right: -30,
    bottom: -10,
    height: 96,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 80,
    backgroundColor: '#1B4F45',
  },
  path: {
    position: 'absolute',
    left: 78,
    bottom: 18,
    width: 18,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#F7F1E4',
    transform: [{ rotate: '-18deg' }],
  },
  pin: {
    position: 'absolute',
    top: 46,
    right: 54,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.yellow,
    borderWidth: 3,
    borderColor: colors.white,
  },
  sign: {
    position: 'absolute',
    left: 22,
    bottom: 36,
    gap: 4,
    backgroundColor: '#8C5A34',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radius.control,
  },
  post: {
    position: 'absolute',
    left: 8,
    top: -8,
    bottom: -28,
    width: 6,
    backgroundColor: '#6E4528',
  },
  signText: {
    marginLeft: 10,
    color: '#F8F3EA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
