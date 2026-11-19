import { LayoutRectangle, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';

const SCAN_BOX_WIDTH = 350;
const SCAN_BOX_HEIGHT = 200;
const CORNER_RADIUS = 10;
const MASK_BORDER_WIDTH = 1000;

type ViewfinderOverlayProps = {
  onScanBoxLayout: (layout: LayoutRectangle) => void;
};

export function ViewfinderOverlay({ onScanBoxLayout }: ViewfinderOverlayProps) {
  return (
    <View
      className="absolute inset-0 items-center justify-center"
      pointerEvents="none"
    >
      {/* Dimmed Surround Cutout Mask */}
      <View
        className="absolute border-neutral-950/40"
        style={{
          width: SCAN_BOX_WIDTH + MASK_BORDER_WIDTH * 2,
          height: SCAN_BOX_HEIGHT + MASK_BORDER_WIDTH * 2,
          borderWidth: MASK_BORDER_WIDTH,
          borderRadius: MASK_BORDER_WIDTH + CORNER_RADIUS,
        }}
      />

      {/* Active Scan Window */}
      <View
        className="justify-center bg-transparent"
        style={{ width: SCAN_BOX_WIDTH, height: SCAN_BOX_HEIGHT }}
        onLayout={(event) => onScanBoxLayout(event.nativeEvent.layout)}
      >
        <Badge
          variant="secondary"
          className="absolute -top-10 self-center border-border/60 bg-background/85 px-3 py-1 "
        >
          <Text className="text-xs font-medium text-foreground">
            Align barcode within the frame
          </Text>
        </Badge>

        {/* Corner Brackets */}
        <View
          className="absolute top-0 left-0 ml-1 mt-1 h-6 w-6 border-t-4 border-l-4 border-green-500"
          style={{ borderTopLeftRadius: CORNER_RADIUS }}
        />
        <View
          className="absolute top-0 right-0 mr-1 mt-1 h-6 w-6 border-t-4 border-r-4 border-green-500"
          style={{ borderTopRightRadius: CORNER_RADIUS }}
        />
        <View
          className="absolute bottom-0 left-0 ml-1 mb-1 h-6 w-6 border-b-4 border-l-4 border-green-500"
          style={{ borderBottomLeftRadius: CORNER_RADIUS }}
        />
        <View
          className="absolute right-0 bottom-0 mr-1 mb-1 h-6 w-6 border-r-4 border-b-4 border-green-500"
          style={{ borderBottomRightRadius: CORNER_RADIUS }}
        />

        {/* Center Laser Line */}
        <View className="mx-3 h-1 rounded-full bg-green-500" />
      </View>
    </View>
  );
}