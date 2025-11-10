import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CropBoxProps {
  cropRegion: { x: number; y: number; width: number; height: number };
  onCropRegionChange: (region: { x: number; y: number; width: number; height: number }) => void;
  imageWidth: number;
  imageHeight: number;
}

const HANDLE_SIZE = 24;
const MIN_CROP_SIZE = 100;

export function CropBox({ cropRegion, onCropRegionChange, imageWidth, imageHeight }: CropBoxProps) {
  const [currentRegion, setCurrentRegion] = useState(cropRegion);
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);

  useEffect(() => {
    setCurrentRegion(cropRegion);
  }, [cropRegion]);

  const constrainRegion = (
    newX: number,
    newY: number,
    newWidth: number,
    newHeight: number
  ) => {
    const maxX = imageWidth - newWidth;
    const maxY = imageHeight - newHeight;

    return {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
      width: Math.max(MIN_CROP_SIZE, Math.min(newWidth, imageWidth)),
      height: Math.max(MIN_CROP_SIZE, Math.min(newHeight, imageHeight)),
    };
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt: any) => {
      const { locationX, locationY } = evt.nativeEvent;
      const boxX = currentRegion.x;
      const boxY = currentRegion.y;
      const boxWidth = currentRegion.width;
      const boxHeight = currentRegion.height;

      // Determine which handle or area is being dragged
      const handleMargin = HANDLE_SIZE;
      const isTopLeft = locationX < handleMargin && locationY < handleMargin;
      const isTopRight = locationX > boxWidth - handleMargin && locationY < handleMargin;
      const isBottomLeft = locationX < handleMargin && locationY > boxHeight - handleMargin;
      const isBottomRight =
        locationX > boxWidth - handleMargin && locationY > boxHeight - handleMargin;
      const isTop = locationY < handleMargin && !isTopLeft && !isTopRight;
      const isBottom = locationY > boxHeight - handleMargin && !isBottomLeft && !isBottomRight;
      const isLeft = locationX < handleMargin && !isTopLeft && !isBottomLeft;
      const isRight = locationX > boxWidth - handleMargin && !isTopRight && !isBottomRight;
      const isCenter = !isTop && !isBottom && !isLeft && !isRight;

      if (isTopLeft) setDragHandle('topLeft');
      else if (isTopRight) setDragHandle('topRight');
      else if (isBottomLeft) setDragHandle('bottomLeft');
      else if (isBottomRight) setDragHandle('bottomRight');
      else if (isTop) setDragHandle('top');
      else if (isBottom) setDragHandle('bottom');
      else if (isLeft) setDragHandle('left');
      else if (isRight) setDragHandle('right');
      else if (isCenter) setDragHandle('move');
      else setDragHandle(null);

      setIsDragging(true);
    },
    onPanResponderMove: (evt: any, gestureState: any) => {
      if (!dragHandle) return;

      const { dx, dy } = gestureState;
      let newX = currentRegion.x;
      let newY = currentRegion.y;
      let newWidth = currentRegion.width;
      let newHeight = currentRegion.height;

      switch (dragHandle) {
        case 'move':
          newX = currentRegion.x + dx;
          newY = currentRegion.y + dy;
          break;
        case 'topLeft':
          newX = currentRegion.x + dx;
          newY = currentRegion.y + dy;
          newWidth = currentRegion.width - dx;
          newHeight = currentRegion.height - dy;
          break;
        case 'topRight':
          newY = currentRegion.y + dy;
          newWidth = currentRegion.width + dx;
          newHeight = currentRegion.height - dy;
          break;
        case 'bottomLeft':
          newX = currentRegion.x + dx;
          newWidth = currentRegion.width - dx;
          newHeight = currentRegion.height + dy;
          break;
        case 'bottomRight':
          newWidth = currentRegion.width + dx;
          newHeight = currentRegion.height + dy;
          break;
        case 'top':
          newY = currentRegion.y + dy;
          newHeight = currentRegion.height - dy;
          break;
        case 'bottom':
          newHeight = currentRegion.height + dy;
          break;
        case 'left':
          newX = currentRegion.x + dx;
          newWidth = currentRegion.width - dx;
          break;
        case 'right':
          newWidth = currentRegion.width + dx;
          break;
      }

      const constrained = constrainRegion(newX, newY, newWidth, newHeight);
      setCurrentRegion(constrained);
      onCropRegionChange(constrained);
    },
    onPanResponderRelease: () => {
      setIsDragging(false);
      setDragHandle(null);
    },
  });

  return (
    <View
      style={[
        styles.box,
        {
          left: currentRegion.x,
          top: currentRegion.y,
          width: currentRegion.width,
          height: currentRegion.height,
        },
      ]}
      {...panResponder.panHandlers}>
      {/* Border */}
      <View style={styles.border} />
      
      {/* Corner handles */}
      <View style={[styles.handle, styles.topLeftHandle]} />
      <View style={[styles.handle, styles.topRightHandle]} />
      <View style={[styles.handle, styles.bottomLeftHandle]} />
      <View style={[styles.handle, styles.bottomRightHandle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
  },
  border: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#fff',
  },
  topLeftHandle: {
    top: -HANDLE_SIZE / 2,
    left: -HANDLE_SIZE / 2,
  },
  topRightHandle: {
    top: -HANDLE_SIZE / 2,
    right: -HANDLE_SIZE / 2,
  },
  bottomLeftHandle: {
    bottom: -HANDLE_SIZE / 2,
    left: -HANDLE_SIZE / 2,
  },
  bottomRightHandle: {
    bottom: -HANDLE_SIZE / 2,
    right: -HANDLE_SIZE / 2,
  },
});
