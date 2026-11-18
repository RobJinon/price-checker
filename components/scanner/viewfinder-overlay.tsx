import { LayoutRectangle, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';

const SCAN_BOX_WIDTH = 280;
const SCAN_BOX_HEIGHT = 170;
const CORNER_RADIUS = 16;
const MASK_BORDER_WIDTH = 1000;

type ViewfinderOverlayProps = {
  onScanBoxLayout: (layout: LayoutRectangle) => void;
};

export function ViewfinderOverlay({ onScanBoxLayout }: ViewfinderOverlayProps) {
  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.cutoutMask} />

      <View
        style={styles.scanWindow}
        onLayout={(event) => onScanBoxLayout(event.nativeEvent.layout)}
      >
        <Text className="absolute -top-9 self-center text-sm font-medium text-slate-200">
          Align barcode within the frame
        </Text>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        <View style={styles.scanLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cutoutMask: {
    position: 'absolute',
    width: SCAN_BOX_WIDTH + MASK_BORDER_WIDTH * 2,
    height: SCAN_BOX_HEIGHT + MASK_BORDER_WIDTH * 2,
    borderWidth: MASK_BORDER_WIDTH,
    borderColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: MASK_BORDER_WIDTH + CORNER_RADIUS,
  },
  scanWindow: {
    width: SCAN_BOX_WIDTH,
    height: SCAN_BOX_HEIGHT,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  scanLine: {
    height: 4,
    backgroundColor: 'rgba(246, 59, 59, 0.85)',
    marginHorizontal: 12,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#f63b3b',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: CORNER_RADIUS,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: CORNER_RADIUS,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: CORNER_RADIUS,
  },
});